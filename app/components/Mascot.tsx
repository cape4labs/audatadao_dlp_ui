"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface MascotProps {
  externalError?: string | null;
}

export default function Mascot({ externalError }: MascotProps) {
  const [message, setMessage] = useState<React.ReactNode | null>(null);
  const [visible, setVisible] = useState(false);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const hasGreeted = localStorage.getItem("mascot_greeted");
    if (!hasGreeted) {
      setTimeout(() => {
        setMessage(
          <>
            Hi! I'm the mascot of the <b>Audata</b> team!  
            I'll help you with uploading files!
          </>
        );
        setVisible(true);
      }, 500);
      setTimeout(() => {
        setVisible(false);
        localStorage.setItem("mascot_greeted", "true");
      }, 7000);
    }
  }, []);

  useEffect(() => {
    if (!externalError) return;

    const err = externalError.toLowerCase();
    let content: React.ReactNode = null;

    if (err.includes("score=")) {
      const score = parseFloat(externalError.match(/score=([\d.]+)/)?.[1] || "0").toFixed(2);
      const authenticity = externalError.match(/authenticity=([\d.]+)/)?.[1];
      const ownership = externalError.match(/ownership=([\d.]+)/)?.[1];
      const quality = parseFloat(externalError.match(/quality=([\d.]+)/)?.[1] || "0").toFixed(2);
      const uniqueness = externalError.match(/uniqueness=([\d.]+)/)?.[1];

      content = (
        <>
          Your audio was analyzed  
          <br />
          • <b>Score</b>: {score} — overall similarity score
          <br />  
          • <b>Authenticity</b>: {authenticity} — how real your voice sounds  
          <br />
          • <b>Ownership</b>: {ownership} — how consistent it is with your previous uploads  
          <br />
          • <b>Quality</b>: {quality} — audio clarity and signal strength  
          <br />
          • <b>Uniqueness</b>: {uniqueness} — how distinct your voice is  
          <br />
          <br />
          Seems like the total score is below the threshold, so the audio was rejected.  
          <br />
          Try recording a clearer and more unique voice sample.
        </>
      );
    } else if (err.includes("language")) {
      content = <>You must select the language of the audio before uploading.</>;
    } else if (err.includes("wallet")) {
      content = <>Please connect your wallet before uploading.</>;
    } else {
      content = <>{externalError}</>;
    }

    setMessage(content);
    setVisible(true);

    const timeout = setTimeout(() => setVisible(false), 15000);
    return () => clearTimeout(timeout);
  }, [externalError]);

  useEffect(() => {
    const resetInactivityTimer = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(() => {
        setMessage(
          <>
            Hey there! 
            <br /> Any issues? Check the guide how to contribute:{" "}
            <a
              href="https://audata.gitbook.io/audata-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              here
            </a>
          </>
        );
        setVisible(true);
        setTimeout(() => setVisible(false), 5000);
      }, 25000);
    };

    const events = ["keydown", "scroll", "click"];
    events.forEach((event) =>
      window.addEventListener(event, resetInactivityTimer)
    );

    resetInactivityTimer();

    return () => {
      events.forEach((event) =>
        window.removeEventListener(event, resetInactivityTimer)
      );
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  if (!visible || !message) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.4 }}
          className="fixed bottom-6 right-6 flex items-end gap-3 z-50"
        >
          <div className="bg-white shadow-xl border rounded-2xl p-3 max-w-sm text-sm text-gray-800 whitespace-pre-line">
            {message}
          </div>
          <Image
            src="/mascot.png"
            alt="Mascot"
            width={70}
            height={70}
            className="object-contain"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
