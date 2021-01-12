import { createSlice, Dispatch } from '@reduxjs/toolkit';
import { loadAllSettings, updateEntry } from '../database/SettingsDao';
// eslint-disable-next-line import/no-cycle
import { RootState } from '../store';
import { Setting } from '../utils/types';

const settingsSlice = createSlice({
    name: 'settings',
    initialState: {
        settings: [],
        chosenIndex: undefined,
    },
    reducers: {
        chooseSetting: (state, input) => {
            state.chosenIndex = input.payload.index;
        },
        updateSettings: (state, index) => {
            state.settings = index.payload;
        },
    },
});

export const settingsSelector = (state: RootState) => state.settings.settings;

export const chosenIndexSelector = (state: RootState) =>
    state.settings.chosenIndex;

export const { chooseSetting, updateSettings } = settingsSlice.actions;

export async function selectSettings(dispatch: Dispatch, index: number) {
    dispatch(chooseSetting({ index }));
}

/**
 * Updates the given Setting in the database, and dispatches an update to the state
 * with the updated settings from the database.
 * @param dispatch redux dispatch function
 * @param updatedEntry the Setting that has been updated
 */
export async function updateSettingEntry(
    dispatch: Dispatch,
    updatedEntry: Setting
) {
    await updateEntry(updatedEntry);
    const settings = await loadAllSettings();
    dispatch(updateSettings(settings));
}

export default settingsSlice.reducer;
