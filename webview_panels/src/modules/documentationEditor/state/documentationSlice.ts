import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GenerationDBDataProps } from "../types";
import {
  DBTDocumentation,
  DocsGenerateUserInstructions,
  DocumentationStateProps,
  MetadataColumn,
  Pages,
} from "./types";
import { mergeCurrentAndIncomingDocumentationColumns } from "../utils";

export const initialState = {
  incomingDocsData: undefined,
  currentDocsData: undefined,
  currentDocsTests: undefined,
  project: undefined,
  generationHistory: [],
  isDocGeneratedForAnyColumn: false,
  isTestUpdatedForAnyColumn: false,
  insertedEntityName: undefined,
  userInstructions: {
    language: undefined,
    persona: undefined,
    prompt_hint: undefined,
  },
  selectedPages: [Pages.DOCUMENTATION],
  conversations: {},
  showConversationsRightPanel: false,
  collaborationEnabled: false,
} as DocumentationStateProps;

const documentationSlice = createSlice({
  name: "documentationState",
  initialState,
  reducers: {
    updatConversations: (
      state,
      { payload }: PayloadAction<DocumentationStateProps["conversations"]>,
    ) => {
      Object.entries(payload).forEach(([shareId, conversationGroups]) => {
        state.conversations[parseInt(shareId)] = conversationGroups;
      });
    },
    addToSelectedPage: (state, action: PayloadAction<Pages>) => {
      state.selectedPages.push(action.payload);
    },
    updateConversationsRightPanelState: (
      state,
      action: PayloadAction<
        DocumentationStateProps["showConversationsRightPanel"]
      >,
    ) => {
      state.showConversationsRightPanel = action.payload;
    },
    updateCollaborationEnabled: (
      state,
      action: PayloadAction<DocumentationStateProps["collaborationEnabled"]>,
    ) => {
      state.collaborationEnabled = action.payload;
    },
    updateSelectedConversationGroup: (
      state,
      action: PayloadAction<
        DocumentationStateProps["selectedConversationGroup"]
      >,
    ) => {
      state.selectedConversationGroup = action.payload;
    },
    removeFromSelectedPage: (state, action: PayloadAction<Pages>) => {
      if (state.selectedPages.length === 1) {
        return;
      }
      state.selectedPages = state.selectedPages.filter(
        (p) => p !== action.payload,
      );
    },
    setProject: (
      state,
      action: PayloadAction<DocumentationStateProps["project"]>,
    ) => {
      state.project = action.payload;
    },
    updateCurrentDocsTests: (
      state,
      action: PayloadAction<DocumentationStateProps["currentDocsTests"]>,
    ) => {
      state.currentDocsTests = action.payload;
    },
    setInsertedEntityName: (
      state,
      action: PayloadAction<string | undefined>,
    ) => {
      state.insertedEntityName = action.payload;
    },
    setIncomingDocsData: (
      state,
      action: PayloadAction<DocumentationStateProps["incomingDocsData"]>,
    ) => {
      const isDifferentEntity =
        action.payload?.docs?.uniqueId !== state.currentDocsData?.uniqueId;

      // if current file is not changed, then keep the current changes
      if (!isDifferentEntity) {
        return;
      }

      // if test/docs data is not changed, then update the state
      const isCleanForm =
        !state.isDocGeneratedForAnyColumn && !state.isTestUpdatedForAnyColumn;

      if (
        !state.currentDocsData || // if first load, currentDocsData will be undefined
        isCleanForm
      ) {
        state.currentDocsData = action.payload?.docs;
        state.currentDocsTests = action.payload?.tests;
        return;
      }

      // If any changes are done in current model, then show alert
      // empty json to handle cases of switching to file which are not models
      state.incomingDocsData = action.payload ?? {};
      return;
    },
    updateCurrentDocsData: (
      state,
      action: PayloadAction<
        (Partial<DBTDocumentation> & { isNewGeneration?: boolean }) | undefined
      >,
    ) => {
      state.incomingDocsData = undefined;
      // incase of yml files, incoming docs data will be {}, so checking for keys length as well
      if (!action.payload || !Object.keys(action.payload).length) {
        state.currentDocsData = undefined;
        return;
      }
      if (!action.payload.name) {
        return;
      }
      if (!state.currentDocsData) {
        // Initial render
        // @ts-expect-error TODO fix this type
        state.currentDocsData = action.payload;
        return;
      }

      // switching editor
      if (
        action.payload.name &&
        state.currentDocsData?.name !== action.payload.name
      ) {
        // @ts-expect-error TODO fix this type
        state.currentDocsData = action.payload;
        return;
      }
      state.currentDocsData = { ...state.currentDocsData, ...action.payload };
      if (action.payload.isNewGeneration !== undefined) {
        state.isDocGeneratedForAnyColumn = action.payload.isNewGeneration;
      }
    },
    updateColumnsAfterSync: (
      state,
      {
        payload: { columns },
      }: PayloadAction<{
        columns: DBTDocumentation["columns"];
      }>,
    ) => {
      if (!state.currentDocsData) {
        return;
      }

      state.currentDocsData.columns =
        mergeCurrentAndIncomingDocumentationColumns(
          state.currentDocsData.columns,
          columns,
        );
      state.isDocGeneratedForAnyColumn = true;
    },
    updateColumnsInCurrentDocsData: (
      state,
      {
        payload: { columns, isNewGeneration },
      }: PayloadAction<{
        columns: Partial<
          MetadataColumn & {
            description?: string;
          }
        >[];
        isNewGeneration?: boolean;
      }>,
    ) => {
      if (!state.currentDocsData) {
        return;
      }
      state.currentDocsData.columns = state.currentDocsData.columns.map((c) => {
        const updatedColumn = columns.find((column) => c.name === column.name);
        if (updatedColumn) {
          return { ...c, ...updatedColumn };
        }
        return c;
      });
      if (isNewGeneration !== undefined) {
        state.isDocGeneratedForAnyColumn = isNewGeneration;
      }
    },
    addToGenerationsHistory: (
      state,
      action: PayloadAction<GenerationDBDataProps[]>,
    ) => {
      action.payload.forEach((history) => {
        state.generationHistory.push(history);
      });
    },
    setGenerationsHistory: (
      state,
      action: PayloadAction<GenerationDBDataProps[]>,
    ) => {
      state.generationHistory = action.payload;
    },
    setIsDocGeneratedForAnyColumn: (state, action: PayloadAction<boolean>) => {
      state.isDocGeneratedForAnyColumn = action.payload;
    },
    setIsTestUpdatedForAnyColumn: (state, action: PayloadAction<boolean>) => {
      state.isTestUpdatedForAnyColumn = action.payload;
    },
    resetGenerationsHistory: (state, _action: PayloadAction<undefined>) => {
      state.generationHistory = [];
    },
    updateUserInstructions: (
      state,
      action: PayloadAction<DocsGenerateUserInstructions>,
    ) => {
      state.userInstructions = { ...state.userInstructions, ...action.payload };
    },
  },
});

export const {
  setIncomingDocsData,
  updateCurrentDocsData,
  updateColumnsInCurrentDocsData,
  updateColumnsAfterSync,
  setProject,
  addToGenerationsHistory,
  resetGenerationsHistory,
  setGenerationsHistory,
  updateUserInstructions,
  setIsDocGeneratedForAnyColumn,
  setIsTestUpdatedForAnyColumn,
  setInsertedEntityName,
  updateCurrentDocsTests,
  addToSelectedPage,
  removeFromSelectedPage,
  updatConversations,
  updateConversationsRightPanelState,
  updateSelectedConversationGroup,
  updateCollaborationEnabled,
} = documentationSlice.actions;
export default documentationSlice;
