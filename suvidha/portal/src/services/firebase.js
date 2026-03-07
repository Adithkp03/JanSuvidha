import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAZZWeKRBmYJiP2o24OIvyLMQ07fBJ1rCg",
    authDomain: "otp-sending-c2a0c.firebaseapp.com",
    projectId: "otp-sending-c2a0c",
    storageBucket: "otp-sending-c2a0c.firebasestorage.app",
    messagingSenderId: "472655451250",
    appId: "1:472655451250:web:c3d68c9fcaed3e6e9f1eeb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
