import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { auth, db } from "../config/firebase";

interface GameResult {
  gameType: "kout" | "baloot" | "hand";
  team1?: { name: string; score: number };
  team2?: { name: string; score: number };
  players?: { name: string; score: number }[];
  winner: string;
  rounds?: number;
  duration?: number; // in seconds
  timestamp?: any;
}

interface FirebaseContextType {
  user: User | null;
  isLoading: boolean;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  doSignOut: () => Promise<void>;
  saveGameResult: (gameData: GameResult) => Promise<void>;
  getGameHistory: () => Promise<any[]>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(
  undefined
);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUpWithEmail = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: userCredential.user.email,
      createdAt: serverTimestamp(),
      stats: { totalGames: 0, wins: 0, winRate: 0 },
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const doSignOut = async () => {
    await signOut(auth);
  };

  const saveGameResult = async (gameData: GameResult) => {
    if (!user) {
      console.log("User not logged in, skipping save");
      return;
    }

    try {
      await addDoc(collection(db, "users", user.uid, "games"), {
        ...gameData,
        timestamp: serverTimestamp(),
      });
      console.log("Game saved successfully!");
    } catch (error) {
      console.error("Error saving game:", error);
    }
  };

  const getGameHistory = async () => {
    if (!user) return [];
    try {
      const q = query(
        collection(db, "users", user.uid, "games"),
        orderBy("timestamp", "desc"),
        limit(50)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting game history:", error);
      return [];
    }
  };

  const value: FirebaseContextType = {
    user,
    isLoading,
    signUpWithEmail,
    signInWithEmail,
    doSignOut,
    saveGameResult,
    getGameHistory,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {!isLoading && children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
};
