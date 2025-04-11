"use client";
import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const ProfilePage = () => {
  const [user, setUser] = useState<any>(null);
  const [personalityAnalysis, setPersonalityAnalysis] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Fetch personality analysis from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setPersonalityAnalysis(userDoc.data().personalityAnalysis);
        }
      } else {
        setUser(null);
        setPersonalityAnalysis(null);
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
        <h2>Personality Analysis</h2>
        {personalityAnalysis ? (
          <p>{personalityAnalysis}</p>
        ) : (
          <p>No personality analysis available.</p>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
