
import React, { useState, useEffect } from 'react';
import { AtSign, ExternalLink, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { UserRole, AppState, Question, TestSettings, StudentResult } from './types';
import { AdminPanel } from './components/AdminPanel';
import { StudentTest } from './components/StudentTest';
import { db, isFirebaseConfigured, auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, sendEmailVerification, updateProfile, handleFirestoreError, OperationType } from './services/firebase';
import { doc, onSnapshot, setDoc, collection, deleteDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface Notification {
  message: string;
  type: 'success' | 'error';
}

export default function App() {
  const [role, setRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('app_user_role');
    return (saved as UserRole) || UserRole.NONE;
  });
  const [appState, setAppState] = useState<AppState>(() => {
    const saved = localStorage.getItem('app_state');
    return (saved as AppState) || AppState.WELCOME;
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [studentResults, setStudentResults] = useState<StudentResult[]>(() => {
    const saved = localStorage.getItem('exam_results');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentStudent, setCurrentStudent] = useState(() => {
    const saved = localStorage.getItem('current_student');
    return saved ? JSON.parse(saved) : { name: '', studentId: '', shift: 'Shift 1' };
  });
  const [adminAuthenticated, setAdminAuthenticated] = useState(() => {
    return localStorage.getItem('admin_authenticated') === 'true';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [savedPasscode, setSavedPasscode] = useState(() => localStorage.getItem('teacher_passcode') || 'admin@123');
  
  const [testSettings, setTestSettings] = useState<TestSettings>({
    title: 'Ambition Academic Exam',
    subject: 'Computer',
    subSubject: 'Keyboard Typing',
    date: new Date().toISOString().split('T')[0],
    timeLimit: 30,
    strictMode: false,
    testMode: 'MCQ',
    typingText: '',
    frequency: 'Once'
  });

  // Split-pane login states
  const [isSignup, setIsSignup] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showNewRecoveredPasscode, setShowNewRecoveredPasscode] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('app_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('app_user_role', role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem('app_state', appState);
  }, [appState]);

  useEffect(() => {
    localStorage.setItem('current_student', JSON.stringify(currentStudent));
  }, [currentStudent]);

  useEffect(() => {
    localStorage.setItem('admin_authenticated', String(adminAuthenticated));
  }, [adminAuthenticated]);

  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  // Security Hint states
  const [securityQuestion, setSecurityQuestion] = useState(() => localStorage.getItem('admin_security_question') || 'What is your school name?');
  const [securityAnswer, setSecurityAnswer] = useState(() => localStorage.getItem('admin_security_answer') || 'ambition');
  const [isRecoveringPasscode, setIsRecoveringPasscode] = useState(false);
  const [recoveryAnswerInput, setRecoveryAnswerInput] = useState('');
  const [newRecoveredPasscode, setNewRecoveredPasscode] = useState('');

  // Password reset states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [resetInProgress, setResetInProgress] = useState(false);

  // Firebase auth state tracking
  const [currentAuthUser, setCurrentAuthUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentAuthUser(user);
      setAuthLoading(false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Synchronize state with Firebase (Firestore) when configured
  useEffect(() => {
    if (!isFirebaseConfigured || !db) return;

    // 1. Real-time listener for active exam config (settings, questions, passcode)
    const examDocRef = doc(db, 'config', 'activeExam');
    const unsubscribeExam = onSnapshot(examDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.questions !== undefined) setQuestions(data.questions);
        if (data.settings !== undefined) setTestSettings(data.settings);
        if (data.passcode !== undefined) setSavedPasscode(data.passcode);
        if (data.securityQuestion !== undefined) {
          setSecurityQuestion(data.securityQuestion);
          localStorage.setItem('admin_security_question', data.securityQuestion);
        }
        if (data.securityAnswer !== undefined) {
          setSecurityAnswer(data.securityAnswer);
          localStorage.setItem('admin_security_answer', data.securityAnswer);
        }
      } else {
        // Initialize the cloud config if empty - Only do this if the authenticated user is the admin rohtjan4@gmail.com
        if (currentAuthUser && currentAuthUser.email === 'rohtjan4@gmail.com') {
          setDoc(examDocRef, {
            questions: [],
            settings: {
              title: 'Ambition Academic Exam',
              subject: 'Computer',
              subSubject: 'Keyboard Typing',
              date: new Date().toISOString().split('T')[0],
              timeLimit: 30,
              strictMode: false,
              testMode: 'MCQ',
              typingText: '',
              frequency: 'Once'
            },
            passcode: 'admin@123',
            securityQuestion: 'What is your school name?',
            securityAnswer: 'ambition'
          }).catch(err => handleFirestoreError(err, OperationType.WRITE, 'config/activeExam'));
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'config/activeExam');
    });

    return () => {
      unsubscribeExam();
    };
  }, [currentAuthUser]);

  // 2. Real-time listener for student results - Restricted to ADMIN users only to prevent unauthorized database calls
  useEffect(() => {
    if (!isFirebaseConfigured || !db || role !== UserRole.ADMIN || !adminAuthenticated) return;

    const resultsCollectionRef = collection(db, 'results');
    const unsubscribeResults = onSnapshot(resultsCollectionRef, (querySnap) => {
      const liveResults: StudentResult[] = [];
      querySnap.forEach((doc) => {
        liveResults.push({ id: doc.id, ...doc.data() } as StudentResult);
      });
      liveResults.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setStudentResults(liveResults);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'results');
    });

    return () => {
      unsubscribeResults();
    };
  }, [role, adminAuthenticated]);

  const updateFirebaseConfig = async (fields: { questions?: Question[], settings?: TestSettings, passcode?: string, securityQuestion?: string, securityAnswer?: string }) => {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'config', 'activeExam'), fields, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'config/activeExam');
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('exam_results', JSON.stringify(studentResults));
  }, [studentResults]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#admin') {
        setShowLoginModal(true);
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => {
      window.removeEventListener('hashchange', checkHash);
    };
  }, []);

  const showNotify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (passcodeInput === savedPasscode) {
      setAdminAuthenticated(true);
      setRole(UserRole.ADMIN);
      setAppState(AppState.DASHBOARD);
      setShowLoginModal(false);
      setPasscodeInput('');
      setLoginError(false);
      showNotify("Teacher Login Successful! ✅");
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 500);
    }
  };

  // Helper to get registered mock users
  const getMockUsers = () => {
    const users = localStorage.getItem('mock_users');
    return users ? JSON.parse(users) : {};
  };

  // Helper to save registered mock users
  const saveMockUser = (user: string, pass: string, email?: string) => {
    const users = getMockUsers();
    users[user.toLowerCase()] = { password: pass, email: email || '' };
    localStorage.setItem('mock_users', JSON.stringify(users));
  };

  const handleGoogleSignIn = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        if (user.email === 'rohtjan4@gmail.com') {
          setAdminAuthenticated(true);
          setRole(UserRole.ADMIN);
          setAppState(AppState.DASHBOARD);
          showNotify("Teacher Access Granted via Google! 👨‍🏫");
        } else {
          showNotify(`Welcome back, ${user.displayName || 'Student'}! 🌟`);
          setCurrentStudent(prev => ({ 
            ...prev, 
            name: user.displayName || 'Google Student',
            studentId: '' // Let them verify/provide SPAxxx ID next
          }));
          setRole(UserRole.STUDENT);
          setAppState(AppState.STUDENT_INFO);
        }
      } catch (error: any) {
        console.error("Google Auth error:", error);
        if (error.code === 'auth/popup-blocked') {
          showNotify("Popup Blocked! Please open this app in a new tab or allow popups.", "error");
        } else if (error.code === 'auth/unauthorized-domain') {
          showNotify(`Unauthorized Domain! Please add "${window.location.hostname}" to Firebase Console -> Authentication -> Settings -> Authorized Domains.`, "error");
          alert(`Firebase Authentication - Unauthorized Domain!\n\nTo allow Google popup login here:\n1. Open: https://console.firebase.google.com/\n2. Go to: Authentication -> Settings -> Authorized Domains\n3. Click "Add domain" and enter:\n\n${window.location.hostname}\n\nOnce added, Google Sign-In will begin working instantly!`);
        } else {
          showNotify(error.message || "Failed Google Sign-In. Try Email Login instead.", "error");
        }
      }
    } else {
      // Offline simulation helper
      showNotify("Offline Mode: Simulated Google Auth Success! 🌟");
      setCurrentStudent(prev => ({ 
        ...prev, 
        name: "Google Learner",
        studentId: ''
      }));
      setRole(UserRole.STUDENT);
      setAppState(AppState.STUDENT_INFO);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) {
      showNotify("Please fill in all fields.", "error");
      return;
    }

    // Direct match for Teacher/Admin mode using passcode in username/password field to make it fully frictionless!
    if (usernameInput.toLowerCase() === 'admin' && passwordInput === savedPasscode) {
      setAdminAuthenticated(true);
      setRole(UserRole.ADMIN);
      setAppState(AppState.DASHBOARD);
      showNotify("Teacher Access Granted! 👨‍🏫");
      return;
    }

    let loginEmail = usernameInput.trim();

    if (isFirebaseConfigured && auth) {
      try {
        const isEmail = loginEmail.includes('@');
        if (!isEmail && db) {
          try {
            const usernameDocRef = doc(db, 'usernames', loginEmail.toLowerCase());
            const docSnap = await getDoc(usernameDocRef);
            if (docSnap.exists()) {
              loginEmail = docSnap.data().email || loginEmail;
            } else {
              console.log("No specific email found for username:", loginEmail);
            }
          } catch (lookupErr) {
            console.warn("Username index lookup failed: ", lookupErr);
          }
        }

        const userCredential = await signInWithEmailAndPassword(auth, loginEmail, passwordInput);
        const user = userCredential.user;

        // Check if email is verified
        if (!user.emailVerified) {
          // Send/Resend verification link automatically with redirect URL back to this app
          const actionCodeSettings = {
            url: window.location.origin,
            handleCodeInApp: true,
          };
          await sendEmailVerification(user, actionCodeSettings);
          await signOut(auth);
          showNotify("Email not verified yet! A verification link was sent to " + user.email + ". Check your inbox/spam. 📧", "error");
          return;
        }

         showNotify(`Welcome, ${user.displayName || usernameInput.split('@')[0]}! ✅`);
        if (user.email === 'rohtjan4@gmail.com') {
          setAdminAuthenticated(true);
          setRole(UserRole.ADMIN);
          setAppState(AppState.DASHBOARD);
        } else {
          setCurrentStudent(prev => ({ 
            ...prev, 
            name: user.displayName || usernameInput.split('@')[0],
            studentId: '' 
          }));
          setRole(UserRole.STUDENT);
          setAppState(AppState.STUDENT_INFO);
        }
      } catch (error: any) {
        console.error("Firebase Sign In error:", error);
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
          showNotify("Invalid Email/Username or Password. Please try again! ❌", "error");
        } else {
          showNotify("Login failed. If you just signed up, verify your email first! ❌", "error");
        }
      }
    } else {
      // Local fallback checking
      const mockUsers = getMockUsers();
      const loginKey = loginEmail.toLowerCase();
      
      let foundUser = mockUsers[loginKey];
      if (!foundUser) {
        // Fallback: search key as email
        foundUser = Object.values(mockUsers).find((u: any) => u.email && u.email.toLowerCase() === loginKey);
      }

      if (foundUser && foundUser.password === passwordInput) {
        // Find display name
        let dispName = usernameInput;
        const matchedKey = Object.keys(mockUsers).find(k => mockUsers[k] === foundUser || (mockUsers[k].email && mockUsers[k].email.toLowerCase() === loginKey));
        if (matchedKey) dispName = matchedKey;

        showNotify(`Welcome back, ${dispName}! ✅`);
        setCurrentStudent(prev => ({ 
          ...prev, 
          name: dispName,
          studentId: '' 
        }));
        setRole(UserRole.STUDENT);
        setAppState(AppState.STUDENT_INFO);
      } else {
        showNotify("Invalid Username/Email or Password. Don't have an account? Press Signup below!", "error");
      }
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpUsername.trim() || !signUpEmail.trim() || !signUpPassword.trim()) {
      showNotify("Please fill in all fields.", "error");
      return;
    }

    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, signUpEmail, signUpPassword);
        const user = userCredential.user;

        // Set the user's display name to the picked username
        await updateProfile(user, { displayName: signUpUsername.trim() });
        
        // Store the username-to-email mapping in Firestore
        if (db) {
          try {
            await setDoc(doc(db, 'usernames', signUpUsername.trim().toLowerCase()), {
              email: signUpEmail.trim().toLowerCase(),
              uid: user.uid
            });
          } catch (dbErr) {
            console.error("Failed to map username in Firestore:", dbErr);
          }
        }

        // Trigger Email Verification link with redirect URL back to this app
        const actionCodeSettings = {
          url: window.location.origin,
          handleCodeInApp: true,
        };
        await sendEmailVerification(user, actionCodeSettings);
        
        // Sign out promptly so they must log in using a verified account
        await signOut(auth);

        showNotify(`Account Created successfully! Verification email sent to ${signUpEmail}. 📧 Please verify to log in.`, "success");
        setUsernameInput(signUpEmail);
        setPasswordInput('');
        setIsSignup(false);
      } catch (error: any) {
        console.error("Firebase SignUp error:", error);
        if (error.code === 'auth/email-already-in-use') {
          showNotify("This email is already registered! Please log in or reset your password.", "error");
        } else if (error.code === 'auth/invalid-email') {
          showNotify("Invalid Email address format. Example: hello@domain.com", "error");
        } else if (error.code === 'auth/weak-password') {
          showNotify("Password is too weak. Please use at least 6 characters.", "error");
        } else {
          showNotify(error.message || "Failed to create account. Enter a valid email format.", "error");
        }
      }
    } else {
      // Local sandbox save
      saveMockUser(signUpUsername, signUpPassword, signUpEmail);
      showNotify("Account created in sandbox mode! You can now log in. 🎉");
      setUsernameInput(signUpUsername);
      setPasswordInput(signUpPassword);
      setIsSignup(false);
    }
  };

  const handlePasswordLost = () => {
    if (usernameInput.toLowerCase() === 'admin') {
      setIsRecoveringPasscode(true);
      setShowLoginModal(true);
      return;
    }
    let prefill = '';
    if (usernameInput && usernameInput.trim()) {
      prefill = usernameInput.trim();
    } else if (signUpEmail && signUpEmail.trim()) {
      prefill = signUpEmail.trim();
    }
    setResetEmailInput(prefill);
    setShowResetModal(true);
  };

  const handleRecoverPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (recoveryAnswerInput.trim().toLowerCase() === securityAnswer.trim().toLowerCase()) {
      if (newRecoveredPasscode.length < 4) {
        showNotify("Passcode must be at least 4 characters.", "error");
        return;
      }
      setSavedPasscode(newRecoveredPasscode);
      localStorage.setItem('teacher_passcode', newRecoveredPasscode);
      showNotify("Passcode reset successfully! ✅");
      updateFirebaseConfig({ passcode: newRecoveredPasscode });
      setIsRecoveringPasscode(false);
      setPasscodeInput(newRecoveredPasscode); // Autofill
      setRecoveryAnswerInput('');
      setNewRecoveredPasscode('');
    } else {
      showNotify("Wrong security answer! Please try again.", "error");
    }
  };

  const executePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = resetEmailInput.trim();
    if (!query) {
      showNotify("Please enter registered Username or Email address.", "error");
      return;
    }

    setResetInProgress(true);
    let targetEmail = query;

    if (isFirebaseConfigured && auth) {
      try {
        // Look up by username first if they typed a username
        if (!query.includes('@') && db) {
          const usernameDocRef = doc(db, 'usernames', query.toLowerCase());
          const docSnap = await getDoc(usernameDocRef);
          if (docSnap.exists()) {
            targetEmail = docSnap.data().email || query;
          }
        }

        const actionCodeSettings = {
          url: window.location.origin,
          handleCodeInApp: true,
        };
        await sendPasswordResetEmail(auth, targetEmail, actionCodeSettings);
        showNotify(`Password Reset Link sent successfully to ${targetEmail}! 📩 Check Inbox / Spam.`, "success");
        setShowResetModal(false);
      } catch (err: any) {
        console.error("Firebase reset email error:", err);
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
          showNotify("No account found with this email/username. Please sign up.", "error");
        } else {
          showNotify(err.message || "Failed to trigger reset email. Make sure it is a valid email.", "error");
        }
      } finally {
        setResetInProgress(false);
      }
    } else {
      // Sandbox mode mock lookup
      const mockUsers = getMockUsers();
      const userKey = query.toLowerCase();
      
      let foundUser = mockUsers[userKey];
      if (!foundUser) {
        foundUser = Object.values(mockUsers).find((u: any) => u.email && u.email.toLowerCase() === userKey);
      }

      if (foundUser) {
        alert(`Your Sandbox Password for "${query}" is: ${foundUser.password}`);
        showNotify("Password retrieved successfully! 🔑", "success");
        setShowResetModal(false);
      } else {
        showNotify(`User "${query}" not found in sandbox mode. Try "admin" with "admin@123"!`, "error");
      }
      setResetInProgress(false);
    }
  };

  const validateStudentId = (id: string) => {
    // Strictly requires "SPA" followed by exactly 4 digits
    const regex = /^SPA\d{4}$/;
    return regex.test(id.toUpperCase());
  };

  const validateName = (name: string) => {
    const regex = /^[A-Za-z\s]+$/;
    return regex.test(name) && name.trim().length > 0;
  };

  const saveResult = async (result: Partial<StudentResult>) => {
    const newResult: StudentResult = {
      id: Date.now().toString(),
      studentId: currentStudent.studentId.toUpperCase(),
      name: currentStudent.name,
      shift: currentStudent.shift,
      testMode: testSettings.testMode,
      timestamp: new Date().toISOString(),
      ...result
    } as StudentResult;

    // Update local state / storage as immediate fallback/offline mode
    setStudentResults(prev => [newResult, ...prev]);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'results', newResult.id), newResult);
        showNotify("Exam synced with Cloud Server! 🔥 Live updates active.");
      } catch (err: any) {
        if (err.code === 'permission-denied') {
          handleFirestoreError(err, OperationType.CREATE, `results/${newResult.id}`);
        } else {
          console.error("Cloud saving failed, stored locally instead:", err);
          showNotify("Cloud Sync pending - saved locally.");
        }
      }
    }
  };

  const resetApp = () => {
    if (isFirebaseConfigured && auth) {
      signOut(auth).catch(err => console.error("Firebase SignOut error:", err));
    }
    setRole(UserRole.NONE);
    setAppState(AppState.WELCOME);
    setAdminAuthenticated(false);
    setCurrentStudent({ name: '', studentId: '', shift: 'Shift 1' });
    
    // Clear all persistent storage keys on session end
    localStorage.removeItem('app_user_role');
    localStorage.removeItem('app_state');
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('current_student');
    
    showNotify("Session Ended Successfully");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans flex flex-col antialiased transition-colors duration-300">
      {/* Theme Toggle Button */}
      <button
        type="button"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        className="fixed top-4 right-4 z-[250] p-3 rounded-2xl shadow-xl border border-gray-200/50 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-gray-700 dark:text-slate-300 hover:scale-105 active:scale-95 hover:shadow-brand-500/10 dark:hover:shadow-brand-500/20 transition-all duration-300 cursor-pointer flex items-center justify-center"
        aria-label="Toggle Theme"
        title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5 text-indigo-600" />
        ) : (
          <Sun className="w-5 h-5 text-amber-400" />
        )}
      </button>
      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
        .animate-pop { animation: popUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes popUp { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 25s linear infinite;
        }
        /* Highlight Global Fonts */
        body {
          font-weight: 500;
        }
        h1, h2, h3, h4, h5, h6 {
          font-weight: 900 !important;
          letter-spacing: -0.02em;
        }
      `}</style>

      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
          <div className={`px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-pop ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
             <span className="font-black text-xl">{notification.type === 'success' ? '✓' : '✕'}</span>
             <span className="font-black tracking-tight">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="flex-1">
        {appState === AppState.WELCOME && (
          <div className="min-h-screen bg-[#f3f7fc] dark:bg-slate-950 relative flex flex-col md:flex-row items-center justify-between overflow-hidden p-6 md:p-12 lg:p-24 transition-colors duration-300">
            
            {/* Background SMM Waves matching the image */}
            <div className="absolute inset-x-0 bottom-0 pointer-events-none z-0 opacity-100 dark:opacity-20">
              <svg className="w-full h-48 md:h-64 lg:h-80" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <path d="M0,192L120,208C240,224,480,256,720,240C960,224,1200,160,1320,128L1440,96L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z" fill="#3b82f6" fillOpacity="0.4" />
                <path d="M0,256L120,245.3C240,235,480,213,720,218.7C960,224,1200,256,1320,272L1440,288L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z" fill="#1d6ce5" fillOpacity="0.7" />
                <path d="M0,288L120,277.3C240,267,480,245,720,256C960,267,1200,309,1320,331L1440,352L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z" fill="#0d4fb5" />
              </svg>
            </div>

            {/* Left Column - Ambition Test Portal Branding */}
            <div className="max-w-2xl w-full z-10 text-center md:text-left mb-12 md:mb-0 select-none animate-pop">
              <h1 className="text-5xl md:text-6xl font-black text-[#112347] dark:text-white mb-4 tracking-tighter leading-none">
                Ambition Test Portal.
              </h1>
              <div className="inline-block mt-2 mb-6">
                <span className="text-4xl md:text-5xl font-black text-[#ef4444] uppercase tracking-wider animate-pulse">
                  EXAM IS LIVE
                </span>
              </div>
              <p className="text-base md:text-lg font-extrabold text-[#3a4d70] dark:text-slate-350 max-w-lg mt-4 leading-relaxed tracking-wide uppercase">
                WE HAVE <span className="text-red-500 font-black">EVERYTHING</span> YOU NEEDED TO RUN <span className="text-green-600 font-black">SUCCESSFUL</span> ACADEMIC ASSESSMENTS
              </p>
              
              <div className="mt-8 flex flex-col justify-center md:justify-start gap-4">
                <div className="flex justify-center md:justify-start">
                  <a
                    href="https://www.instagram.com/Rohitroyal815"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white font-extrabold text-sm uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 hover:shadow-xl hover:shadow-pink-500/20 transition-all duration-300 shadow-md border-2 border-white/20"
                  >
                    <AtSign className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Instagram @Rohitroyal815</span>
                    <ExternalLink className="w-4 h-4 opacity-80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-350" />
                  </a>
                </div>

                <div className="flex flex-col items-center md:items-start gap-2.5 mt-2 bg-white/45 dark:bg-slate-900/40 backdrop-blur-sm px-5 py-3.5 rounded-2xl border border-gray-100 dark:border-slate-800 max-w-xs self-center md:self-start shadow-sm">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em]">Other Social Connects</span>
                  <div className="flex items-center gap-4">
                    {/* Telegram */}
                    <a
                      href="https://t.me/Rohitroyal815"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Join our Telegram"
                      className="group flex items-center justify-center w-10 h-10 bg-[#eef6fc] text-[#0088cc] rounded-xl hover:bg-[#0088cc] hover:text-white hover:scale-110 active:scale-95 shadow-sm hover:shadow-sky-500/10 transition-all duration-300"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.35-.49.97-.74 3.79-1.65 6.32-2.73 7.59-3.25 3.61-1.48 4.36-1.74 4.85-1.75.11 0 .35.03.5.16.13.11.17.27.18.39z" />
                      </svg>
                    </a>

                    {/* Facebook */}
                    <a
                      href="https://www.facebook.com/Rohitroyal815"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Follow us on Facebook"
                      className="group flex items-center justify-center w-10 h-10 bg-[#eef4fc] text-[#1877f2] rounded-xl hover:bg-[#1877f2] hover:text-white hover:scale-110 active:scale-95 shadow-sm hover:shadow-blue-500/10 transition-all duration-300"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>

                    {/* WhatsApp */}
                    <a
                      href="https://wa.me/91815"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Chat on WhatsApp"
                      className="group flex items-center justify-center w-10 h-10 bg-[#edfcf2] text-[#25d366] rounded-xl hover:bg-[#25d366] hover:text-white hover:scale-110 active:scale-95 shadow-sm hover:shadow-emerald-500/10 transition-all duration-300"
                    >
                      <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - SMM Login Card Container */}
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_15px_50px_rgba(0,0,0,0.4)] p-8 md:p-10 z-10 border border-gray-100 dark:border-slate-800 animate-pop transition-colors duration-300">
              {!isSignup ? (
                // SIGN IN FORM
                <form onSubmit={handlePasswordLogin} id="signin-form" className="space-y-6">
                  <div>
                    <label className="block text-[13px] font-extrabold text-[#526a92] dark:text-slate-400 mb-2 uppercase tracking-wider">
                      Username / Email
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 bg-[#f2f7f3] dark:bg-slate-800 border-0 rounded-xl font-bold text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/30 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
                      placeholder="Enter username or email"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-[13px] font-extrabold text-[#526a92] dark:text-slate-400 uppercase tracking-wider">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={handlePasswordLost}
                        className="text-[11px] font-extrabold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 transition-colors uppercase tracking-wider"
                      >
                        Password Lost?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full pl-5 pr-12 py-4 bg-[#f2f7f3] dark:bg-slate-800 border-0 rounded-xl font-bold text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/30 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        placeholder="Enter password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-5 h-5 text-brand-600 border-gray-300 dark:border-slate-700 rounded focus:ring-brand-500/30"
                    />
                    <label htmlFor="remember" className="ml-3 text-[13px] font-extrabold text-[#526a92] dark:text-slate-400 uppercase tracking-wider cursor-pointer">
                      Remember me
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-[#1d6ce5] hover:bg-[#1a5fcd] text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl transition-all uppercase tracking-widest active:scale-95"
                  >
                    Sign in
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200 dark:border-slate-800"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-xs font-black uppercase tracking-wider">or</span>
                    <div className="flex-grow border-t border-gray-200 dark:border-slate-800"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full py-3.5 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 border-2 border-gray-200 dark:border-slate-700 rounded-xl font-black text-sm shadow transition-all uppercase tracking-widest active:scale-95 flex items-center justify-center gap-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    <span>Login with Google</span>
                  </button>

                  <div className="text-center text-sm font-extrabold text-[#526a92] dark:text-slate-400 mt-4 uppercase tracking-wider">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignup(true)}
                      className="text-[#0026db] dark:text-brand-400 text-[16px] hover:underline font-black outline-none"
                    >
                      Signup
                    </button>
                  </div>


                </form>
              ) : (
                // SIGN UP FORM
                <form onSubmit={handleSignUpSubmit} id="signup-form" className="space-y-6">
                  <div>
                    <label className="block text-[13px] font-extrabold text-[#526a92] dark:text-slate-400 mb-2 uppercase tracking-wider">
                      Username
                    </label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 bg-[#f2f7f3] dark:bg-slate-800 border-0 rounded-xl font-bold text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/30 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
                      placeholder="Pick a username"
                      value={signUpUsername}
                      onChange={(e) => setSignUpUsername(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-extrabold text-[#526a92] dark:text-slate-400 mb-2 uppercase tracking-wider">
                      Email address
                    </label>
                    <input
                      type="email"
                      className="w-full px-5 py-4 bg-[#f2f7f3] dark:bg-slate-800 border-0 rounded-xl font-bold text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/30 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
                      placeholder="Enter registered email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-extrabold text-[#526a92] dark:text-slate-400 mb-2 uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showSignUpPassword ? "text" : "password"}
                        className="w-full pl-5 pr-12 py-4 bg-[#f2f7f3] dark:bg-slate-800 border-0 rounded-xl font-bold text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/30 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500"
                        placeholder="Choose password"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      >
                        {showSignUpPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-[#1d6ce5] hover:bg-[#1a5fcd] text-white rounded-xl font-black text-lg shadow-lg hover:shadow-xl transition-all uppercase tracking-widest active:scale-95"
                  >
                    Signup
                  </button>

                  <div className="text-center text-sm font-extrabold text-[#526a92] dark:text-slate-400 mt-4 uppercase tracking-wider">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignup(false)}
                      className="text-brand-600 dark:text-brand-400 hover:underline font-black outline-none text-[18px]"
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              )}

              {/* Removed Teacher Portal Entry Link - Access via URL hash #admin */}
            </div>

            {/* Teacher pass code access pop-up modal */}
            {showLoginModal && (
              <div className="fixed inset-0 bg-[#0d1b3e]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-pop border border-gray-100">
                  {isRecoveringPasscode ? (
                    <div>
                      <h2 className="text-2xl font-black text-gray-900 mb-4 text-center tracking-tight">Passcode Recovery</h2>
                      <p className="text-xs text-amber-600 font-bold bg-amber-50 p-3 rounded-xl mb-6 text-center">
                        💡 Hint Question: {securityQuestion}
                      </p>
                      <form onSubmit={handleRecoverPasscode} className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-1.5 block">Your Secret Answer</label>
                          <input 
                            type="text" 
                            required
                            className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-brand-500 focus:bg-white transition-all"
                            placeholder="Type security answer"
                            value={recoveryAnswerInput}
                            onChange={(e) => setRecoveryAnswerInput(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-1.5 block">New Passcode</label>
                          <div className="relative">
                            <input 
                              type={showNewRecoveredPasscode ? "text" : "password"} 
                              required
                              className="w-full pl-4 pr-12 py-4 bg-gray-50 rounded-2xl font-black text-lg outline-none border-2 border-transparent focus:border-brand-500 focus:bg-white transition-all text-center tracking-widest"
                              placeholder="At least 4 chars"
                              value={newRecoveredPasscode}
                              onChange={(e) => setNewRecoveredPasscode(e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewRecoveredPasscode(!showNewRecoveredPasscode)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                              {showNewRecoveredPasscode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                        
                        <div className="flex gap-4 pt-2">
                          <button 
                            type="button" 
                            onClick={() => { setIsRecoveringPasscode(false); setRecoveryAnswerInput(''); setNewRecoveredPasscode(''); }} 
                            className="flex-1 py-4 font-black text-gray-400 uppercase tracking-widest text-xs hover:text-gray-600 transition-colors"
                          >
                            Back
                          </button>
                          <button 
                            type="submit" 
                            className="flex-1 py-4 bg-amber-500 text-white font-black rounded-2xl shadow-lg uppercase tracking-widest text-xs hover:bg-amber-600 transition-colors"
                          >
                            Reset
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-3xl font-black text-gray-900 mb-6 text-center tracking-tight">Teacher Access</h2>
                      <form onSubmit={handleLogin}>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block text-center">Enter Secret Passcode</label>
                        <div className="relative mb-4">
                          <input 
                            type={showPasscode ? "text" : "password"} 
                            autoFocus 
                            className={`w-full p-5 bg-gray-100 rounded-2xl text-center text-3xl font-black tracking-[0.5em] pr-14 outline-none border-2 ${loginError ? 'border-red-500 bg-red-50 animate-shake text-red-600' : 'border-transparent focus:ring-4 focus:ring-brand-500/20 focus:bg-white'}`} 
                            placeholder="••••" 
                            value={passcodeInput} 
                            onChange={(e) => setPasscodeInput(e.target.value)} 
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasscode(!showPasscode)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                          >
                            {showPasscode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        
                        <div className="text-center mb-6">
                          <button 
                            type="button" 
                            onClick={() => setIsRecoveringPasscode(true)}
                            className="text-xs text-brand-600 font-extrabold hover:underline uppercase tracking-wider"
                          >
                            Forgot Passcode? 🔑
                          </button>
                        </div>

                        <div className="flex gap-4">
                          <button type="button" onClick={() => { setShowLoginModal(false); window.location.hash = ''; }} className="flex-1 py-4 font-black text-gray-400 uppercase tracking-widest text-xs">Cancel</button>
                          <button type="submit" className="flex-1 py-4 bg-brand-600 text-white font-black rounded-2xl shadow-lg uppercase tracking-widest text-xs">Login</button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Beautiful Password Reset popup modal */}
            {showResetModal && (
              <div className="fixed inset-0 bg-[#0d1b3e]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-pop border border-gray-100 my-8">
                  <div className="text-center mb-6">
                    <span className="text-4xl">🔒</span>
                    <h2 className="text-3xl font-black text-gray-900 mt-2 tracking-tight">Reset Password</h2>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">पासवर्ड रीसेट लिंक प्राप्त करें</p>
                  </div>

                  <form onSubmit={executePasswordReset} className="space-y-6">
                    <div>
                      <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">
                        Registered Username or Email ID
                      </label>
                      <input 
                        type="text" 
                        required
                        className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-2xl font-bold text-gray-800 outline-none transition-all placeholder:text-gray-400"
                        placeholder="e.g. your_username or email@gmail.com" 
                        value={resetEmailInput} 
                        onChange={(e) => setResetEmailInput(e.target.value)} 
                      />
                    </div>

                    {/* Highly Helpful Troubleshooting Checklist in Hindi & English */}
                    <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-5 space-y-3 text-left">
                      <h4 className="text-xs font-black text-brand-800 uppercase tracking-wider flex items-center gap-2">
                        💡 Important Instructions (महत्वपूर्ण निर्देश):
                      </h4>
                      <ul className="text-xs text-brand-950 font-bold space-y-2.5 list-disc pl-4 leading-relaxed">
                        <li>
                          <span className="text-red-650">Check Spam Folder (स्पैम फोल्डर देखें):</span> Gmail में 
                          <strong className="text-brand-900"> Spam</strong>, 
                          <strong className="text-brand-900"> Promotions</strong> या 
                          <strong className="text-brand-900"> Junk</strong> सेक्शन अवश्य चेक करें। ईमेल आमतौर पर वहीं जाता है।
                        </li>
                        <li>
                          <span className="text-indigo-650">Username Support:</span> यदि आपने Signup में Username चुना था, 
                          तो आप अपना <strong className="text-brand-900">Username</strong> भी भर सकते हैं, सिस्टम आपकी ईमेल पर लिंक भेज देगा!
                        </li>
                        <li>
                          <span className="text-green-650">Google Sign-In:</span> यदि आपने Google से लॉग इन किया है, तो आपको पासवर्ड की आवश्यकता नहीं है, आप सीधे "Login with Google" कर सकते हैं!
                        </li>
                        <li>
                          <span className="text-cyan-650">For Admin:</span> Make sure <strong className="text-brand-900">Email/Password</strong> provider is enabled in Firebase Console.
                        </li>
                      </ul>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        type="button" 
                        onClick={() => setShowResetModal(false)} 
                        disabled={resetInProgress}
                        className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-extrabold rounded-2xl shadow transition-all uppercase tracking-widest text-xs disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={resetInProgress}
                        className="flex-1 py-4 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-2xl shadow-lg hover:shadow-xl transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {resetInProgress ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Sending...
                          </>
                        ) : (
                          "Send Link ✉️"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {appState === AppState.STUDENT_INFO && (
          <div className="min-h-screen bg-brand-900 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl sm:rounded-[3rem] shadow-2xl p-6 sm:p-12 animate-pop border border-transparent dark:border-slate-800 transition-colors duration-300">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-slate-100 mb-1 sm:mb-2 text-center tracking-tight">Student Login</h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 text-center mb-6 sm:mb-10 font-bold">Please identify yourself to begin.</p>
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="text-[9px] sm:text-[11px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] mb-1.5 sm:mb-3 block">Student Name</label>
                  <input 
                    type="text" 
                    className={`w-full p-4 sm:p-5 bg-gray-50 dark:bg-slate-800 border-2 rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg outline-none transition-all ${currentStudent.name.length > 0 && !validateName(currentStudent.name) ? 'border-red-200 bg-red-50 focus:border-red-500' : 'border-transparent dark:border-slate-700 dark:text-slate-100 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-700'}`} 
                    placeholder="STUDENT NAME" 
                    value={currentStudent.name} 
                    onChange={(e) => setCurrentStudent({...currentStudent, name: e.target.value})} 
                  />
                  {currentStudent.name.length > 0 && !validateName(currentStudent.name) && (
                      <p className="text-[10px] font-black text-red-500 mt-2 uppercase tracking-wide">Alphabets only. No Numbers allowed.</p>
                  )}
                </div>
                <div>
                  <label className="text-[9px] sm:text-[11px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] mb-1 block">Student ID</label>
                  <p className="text-[8px] sm:text-[9px] font-bold text-gray-400 dark:text-slate-400 uppercase mb-1.5 sm:mb-2 tracking-widest">your SPAXXXX id</p>
                  <input 
                      type="text" 
                      maxLength={7}
                      className={`w-full p-4 sm:p-5 bg-gray-50 dark:bg-slate-800 border-2 rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg outline-none tracking-widest transition-all ${currentStudent.studentId.length > 0 && !validateStudentId(currentStudent.studentId) ? 'border-red-200 bg-red-50 focus:border-red-500' : 'border-transparent dark:border-slate-700 dark:text-slate-100 focus:border-brand-500 focus:bg-white dark:focus:bg-slate-700'}`} 
                      placeholder="SPAXXXX" 
                      value={currentStudent.studentId.toUpperCase()} 
                      onChange={(e) => setCurrentStudent({...currentStudent, studentId: e.target.value})} 
                  />
                  {currentStudent.studentId.length > 0 && !validateStudentId(currentStudent.studentId) && (
                      <p className="text-[10px] font-black text-red-500 mt-2 uppercase tracking-wide">Must start with SPA followed by exactly 4 digits.</p>
                  )}
                </div>
                <div>
                  <label className="text-[9px] sm:text-[11px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] mb-1.5 sm:mb-2 block">Class Shift</label>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {['Shift 1', 'Shift 2', 'Shift 3'].map(s => (
                      <button key={s} onClick={() => setCurrentStudent({...currentStudent, shift: s})} className={`py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all border-2 ${currentStudent.shift === s ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-700 dark:text-brand-300 shadow-md' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 text-gray-400 dark:text-slate-400 hover:border-brand-200 dark:hover:border-slate-650'}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <button 
                  disabled={!validateName(currentStudent.name) || !validateStudentId(currentStudent.studentId)} 
                  onClick={() => { if(questions.length === 0 && !testSettings.typingText) { showNotify("Exam content not ready!", "error"); return; } setAppState(AppState.TESTING); }} 
                  className="w-full py-4 sm:py-5 bg-brand-600 text-white rounded-xl sm:rounded-[2rem] font-black text-sm sm:text-xl disabled:opacity-50 shadow-2xl hover:scale-[1.02] active:scale-95 transition-all mt-4"
                >
                  Confirm & Start Exam 🚀
                </button>
                <button 
                  onClick={resetApp} 
                  className="w-full py-3.5 sm:py-4 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all mt-3 sm:mt-4 flex items-center justify-center gap-2"
                >
                  🚪 Logout Session
                </button>
              </div>
            </div>
          </div>
        )}

        {role === UserRole.ADMIN && adminAuthenticated && appState === AppState.DASHBOARD && (
          <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm no-print transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <span className="bg-brand-600 text-white p-2 rounded-xl font-black text-xl">A</span>
                <h2 className="font-black text-gray-900 dark:text-slate-100 text-xl tracking-tighter">Ambition Admin Panel</h2>
              </div>
              <div className="flex gap-4">
                <button onClick={resetApp} className="text-xs font-black text-gray-500 dark:text-slate-400 hover:text-red-600 bg-gray-50 dark:bg-slate-800 px-6 py-3 rounded-2xl transition-all uppercase tracking-widest">Logout</button>
              </div>
            </div>
          </nav>
        )}

        <main>
          {role === UserRole.ADMIN && adminAuthenticated && appState === AppState.DASHBOARD && (
            <div className="max-w-7xl mx-auto p-4 sm:p-10">
              <AdminPanel 
                theme={theme}
                questions={questions}
                settings={testSettings}
                results={studentResults}
                securityQuestion={securityQuestion}
                securityAnswer={securityAnswer}
                onSecurityChange={(q, a) => {
                  setSecurityQuestion(q);
                  setSecurityAnswer(a);
                  localStorage.setItem('admin_security_question', q);
                  localStorage.setItem('admin_security_answer', a);
                  showNotify("Security Question & Answer updated! 💡");
                  updateFirebaseConfig({ securityQuestion: q, securityAnswer: a });
                }}
                onSettingsChange={(newSettings) => {
                  setTestSettings(newSettings);
                  updateFirebaseConfig({ settings: newSettings });
                }}
                onAddQuestion={(q) => {
                  const updated = [...questions, q];
                  setQuestions(updated);
                  showNotify("MCQ Added!");
                  updateFirebaseConfig({ questions: updated });
                }}
                onUpdateQuestion={(updatedQ) => {
                  const updated = questions.map(q => q.id === updatedQ.id ? updatedQ : q);
                  setQuestions(updated);
                  showNotify("Question Updated!");
                  updateFirebaseConfig({ questions: updated });
                }}
                onDeleteQuestion={(id) => {
                  const updated = questions.filter(q => q.id !== id);
                  setQuestions(updated);
                  showNotify("Question Deleted!", "error");
                  updateFirebaseConfig({ questions: updated });
                }}
                onStartTest={() => {
                  setAppState(AppState.TESTING);
                }}
                onPasscodeChange={(newPin) => {
                  setSavedPasscode(newPin);
                  localStorage.setItem('teacher_passcode', newPin);
                  showNotify("Passcode Updated!");
                  updateFirebaseConfig({ passcode: newPin });
                }}
                onClearResults={async () => {
                  setStudentResults([]);
                  localStorage.removeItem('exam_results');
                  showNotify("Data Cleared", "error");
                  if (isFirebaseConfigured && db) {
                    try {
                      const { getDocs, query, collection, deleteDoc, doc } = await import('firebase/firestore');
                      const qSnap = await getDocs(query(collection(db, 'results')));
                      qSnap.forEach(async (docSnap) => {
                        await deleteDoc(doc(db, 'results', docSnap.id));
                      });
                    } catch (err) {
                      console.error("Error clearing Firebase collection:", err);
                    }
                  }
                }}
                onBulkAddQuestions={(newQs) => {
                  const updated = [...questions, ...newQs];
                  setQuestions(updated);
                  showNotify(`${newQs.length} Questions Imported!`);
                  updateFirebaseConfig({ questions: updated });
                }}
              />
            </div>
          )}

          {appState === AppState.TESTING && (
            <StudentTest 
              questions={questions}
              settings={testSettings}
              studentInfo={{...currentStudent}}
              onExit={() => { if (role === UserRole.ADMIN) setAppState(AppState.DASHBOARD); else resetApp(); }}
              onComplete={saveResult}
              isAdminView={role === UserRole.ADMIN}
              onNotify={showNotify}
            />
          )}
        </main>
      </div>

      <footer className="w-full bg-gray-900 overflow-hidden py-4 no-print border-t border-white/5">
        <div className="animate-marquee flex items-center">
          <span className="text-white font-black uppercase text-[10px] tracking-[0.25em] mx-12">
            ™ Ambition Test Portal — Create 🛠 by <a href="https://www.instagram.com/Rohitroyal815" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-350 underline transition-colors">Rohit Royal</a> — All Rights Reserved 2026 — Trusted Technology 💻
          </span>
          <span className="text-white font-black uppercase text-[10px] tracking-[0.25em] mx-12">
            ™ Ambition Test Portal — Create 🛠 by <a href="https://www.instagram.com/Rohitroyal815" target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-350 underline transition-colors">Rohit Royal</a> — All Rights Reserved 2026 — Trusted Technology 💻
          </span>
        </div>
      </footer>
    </div>
  );
}
