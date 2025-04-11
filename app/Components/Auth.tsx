"use client"

import React, { useState } from 'react'; // Import necessary modules from React
import { auth, provider } from '../../firebase'; // Import Firebase auth and provider
import styles from '../Styles/auth.module.css';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image'; // Import Image for Google logo
import Link from 'next/link';

const Auth: React.FC = () => {
    const [email, setEmail] = useState<string>(''); // State for email input
    const [password, setPassword] = useState<string>(''); // State for password input
    const [fullName, setFullName] = useState<string>(''); // State for full name input
    const [confirmPassword, setConfirmPassword] = useState<string>(''); // State for confirm password input
    const router = useRouter(); // Router for navigation
    const pathname = usePathname(); // Get the current pathname
    const isLoginPage = pathname === '/login'; // Check if on login page
    const isSignupPage = pathname === '/signup'; // Check if on signup page

    // Handle signup form submission
    const handleSignup = async (e: React.FormEvent) => {
      e.preventDefault();
      // Check if on the signup page
      try {
        if (isSignupPage) {
          await createUserWithEmailAndPassword(auth, email, password);
          console.log('User signed up successfully');
          setEmail('');
          setPassword('');
          setFullName('');
          setConfirmPassword('');
        }
      } catch (error) {
        console.error('Error signing up:', error);
      } 
    };

    // Handle login form submission
    const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if(isLoginPage) {
            await signInWithEmailAndPassword(auth, email, password);
            console.log('User logged in successfully');
            // Reset form fields after successful login
            setEmail('');
            setPassword('');
        }
      } catch (error) {
        console.error('Error logging in:', error);
      }
    };  
    
    // Handle Google sign in
    const handleGoogleSignIn = async () => {
        try {
          await signInWithPopup(auth, provider);
          console.log('User signed in with google successfully');
          // Reset form fields after successful login
          setEmail('');
          setPassword('');
        } catch (error) {
          console.error('Error signing in with google:', error);
        }
      };
  
    return (
      <div className={styles.container}>
        {isSignupPage && (
          <form onSubmit={handleSignup} className={styles.form}>
            <h2 className={styles.formTitle}>Create Your Account</h2>
            <button className={styles.googleButton} onClick={handleGoogleSignIn} type="button">
                <Image src="/google-logo.svg" alt="Google Logo" className={styles.googleLogo} width={20} height={20}/>
                Continue with Google
            </button>
            <div className={styles.separator}>Or continue with email</div>
            <div>
              <label htmlFor="signup-fullname" className={styles.label}>Full Name</label>
              <input
                className={styles.input}
                type="text"
                id="signup-fullname"
                name="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="signup-email" className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                id="signup-email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="signup-password" className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                id="signup-password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="signup-confirm-password" className={styles.label}>Confirm Password</label>
              <input
                className={styles.input}
                type="password"
                id="signup-confirm-password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={styles.button}>Sign Up</button> 
            <div>Already have an account? <Link href="/login" className={styles.authLink}>Sign in</Link></div>
          </form>
        )}
        {isLoginPage && (
          <form onSubmit={handleLogin} className={styles.form}>
            <h2 className={styles.formTitle}>Log In</h2>
            <button className={styles.googleButton} onClick={handleGoogleSignIn} type="button"> 
                <Image src="/google-logo.svg" alt="Google Logo" className={styles.googleLogo} width={20} height={20}/>
                Continue with Google
            </button>
            <div className={styles.separator}>Or continue with email</div>
            <div>
              <label htmlFor="login-email" className={styles.label}>Email</label>
              <input
                className={styles.input}
                type="email"
                id="login-email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="login-password" className={styles.label}>Password</label>
              <input
                className={styles.input}
                type="password"
                id="login-password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={styles.button}>Log In</button>
            <div>Create account <Link href="/signup" className={styles.authLink}>Sign up</Link></div>
          </form> 
        )} 
      </div>
    );
  };
  
  export default Auth;