import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import { History } from 'history';
/* eslint-disable import/no-cycle */
import accountReducer from '../features/AccountSlice';
import identityReducer from '../features/IdentitySlice';
import settingsReducer from '../features/SettingsSlice';
import addressBookReducer from '../features/AddressBookSlice';
import multiSignatureReducer from '../features/MultiSignatureSlice';
import transactionReducer from '../features/TransactionSlice';
import globalReducer from '../features/GlobalSlice';
import credentialReducer from '../features/CredentialSlice';
import walletReducer from '~/features/WalletSlice';
import miscReducer from '~/features/MiscSlice';
import notificationReducer from '~/features/NotificationSlice';
/* eslint-disable import/no-cycle */

export default function createRootReducer(history: History) {
    return combineReducers({
        router: connectRouter(history),
        identities: identityReducer,
        settings: settingsReducer,
        accounts: accountReducer,
        addressBook: addressBookReducer,
        multisignature: multiSignatureReducer,
        transactions: transactionReducer,
        global: globalReducer,
        credentials: credentialReducer,
        wallet: walletReducer,
        misc: miscReducer,
        notification: notificationReducer,
    });
}
