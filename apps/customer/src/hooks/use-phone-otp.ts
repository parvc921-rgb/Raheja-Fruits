"use client";

import { useCallback, useRef, useState } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

// Wraps Firebase's invisible-reCAPTCHA phone Auth flow. Used during
// registration (after name + phone are collected) and nowhere else —
// return logins use PIN, not OTP, per architecture doc §5.1.
export function usePhoneOtp() {
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  const getVerifier = useCallback((containerId: string) => {
    if (!verifierRef.current) {
      verifierRef.current = new RecaptchaVerifier(auth, containerId, {
        size: "invisible",
      });
    }
    return verifierRef.current;
  }, []);

  const sendOtp = useCallback(
    async (phone: string, recaptchaContainerId: string) => {
      setError(null);
      setSending(true);
      try {
        const verifier = getVerifier(recaptchaContainerId);
        confirmationRef.current = await signInWithPhoneNumber(auth, phone, verifier);
        return true;
      } catch (err) {
        console.error("sendOtp failed", err);
        setError("Couldn't send the verification code. Please try again.");
        return false;
      } finally {
        setSending(false);
      }
    },
    [getVerifier]
  );

  const confirmOtp = useCallback(async (code: string) => {
    if (!confirmationRef.current) {
      setError("Request a new code and try again.");
      return false;
    }
    setError(null);
    setConfirming(true);
    try {
      await confirmationRef.current.confirm(code);
      return true;
    } catch (err) {
      console.error("confirmOtp failed", err);
      setError("That code didn't match. Check and try again.");
      return false;
    } finally {
      setConfirming(false);
    }
  }, []);

  return { sendOtp, confirmOtp, sending, confirming, error };
}
