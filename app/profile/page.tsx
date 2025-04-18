"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import styles from '../Styles/profile.module.css';
import { EnneagramResult } from '../Models/EnneagramResult';


const ProfilePage = () => {
    const [user, setUser] = useState<any>(null);
    const [enneagramResult, setEnneagramResult] = useState<EnneagramResult | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                // Fetch enneagram result from Firestore
               const userDocRef = doc(db, 'users', user.uid);
               const userDoc = await getDoc(userDocRef);
               if (userDoc.exists()) {
                   const data = userDoc.data();
                    setEnneagramResult(data.enneagramResult as EnneagramResult);
                }
            } else {
                setUser(null);
                setEnneagramResult(null);
            }
        });
        return () => unsubscribe();
    }, []);

    if (!user) {
        return <div>Loading or not authenticated...</div>;
    }

    if (!enneagramResult) {
        return (
        <div className={styles.container}>
            <h1>Profile</h1>
            <p>Name: {user.displayName}</p>
            <p>Email: {user.email}</p>
            <div className={styles.resultContainer}>
                <h2>Enneagram Result</h2>
                <p>No result found</p>
            </div>
        </div>);
    }
    return (
        <div className={styles.container}>
            <div className={styles.profileHeader}>
                <h1>Profile</h1>
                <p>Name: {user.displayName}</p>
                <p>Email: {user.email}</p>
            </div>
            <div className={styles.resultContainer}>
            <div className={styles.resultGrid}>
                {Object.entries(enneagramResult).map(([key, value]) => {
                    if (key.startsWith('enneagramType')) {
                        return (
                            <div key={key} className={styles.gridItem}>
                                <strong>{key}:</strong> {value}
                            </div>
                        );
                    }
                return null; })}
                <div className={styles.summary}><strong>Summary :</strong> {enneagramResult.summary}</div>
            </div>
            </div>
        </div>
    );
};

export default ProfilePage;
