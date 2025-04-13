"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const ProfilePage = () => {
    const [user, setUser] = useState<any>(null);
    const [enneagramResult, setEnneagramResult] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                // Fetch enneagram result from Firestore
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setEnneagramResult(userDoc.data().enneagramResult);
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

    return (
        <div>
            <h1>Profile</h1>
            <p>Name: {user.displayName}</p>
            <p>Email: {user.email}</p>
            <div>
                <h2>Enneagram Result</h2>
                {enneagramResult ? (
                    <p>{enneagramResult}</p>
                ) : (
                    <p>No result found</p>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;

     
