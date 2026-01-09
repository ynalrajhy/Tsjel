// App/config/firebase.ts
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// @ts-ignore: getReactNativePersistence exists in the RN bundle but is often missing from public TypeScript definitions.
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Paste YOUR config from Firebase Console here
const firebaseConfig = {
  apiKey: "AIzaSyC7ZSb-6-JuH9Ep7BJplWmjNxQFxc7E3vQ",
  authDomain: "tsjel-ec5f9.firebaseapp.com",
  projectId: "tsjel-ec5f9",
  storageBucket: "tsjel-ec5f9.firebasestorage.app",
  messagingSenderId: "714566802122",
  appId: "1:714566802122:web:d37eea380dbc6e31b7f233",
};

let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

const db = getFirestore(app);


export { auth, db };
