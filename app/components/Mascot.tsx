"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface MascotProps {
  externalError?: string | null;
}

export default function Mascot({ externalError }: MascotProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hasGreeted = localStorage.getItem("mascot_greeted");
    if (!hasGreeted) {
      setTimeout(() => {
        setMessage(`Hi! I'm mascot of audata team! 
                    I will help you with uploading files!`);
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
    let text = "";

    if (err.includes("score=")) {
        const score = externalError.match(/score=([\d.]+)/)?.[1];
        const authenticity = externalError.match(/authenticity=([\d.]+)/)?.[1];
        const ownership = externalError.match(/ownership=([\d.]+)/)?.[1];
        const quality = externalError.match(/quality=([\d.]+)/)?.[1];
        const uniqueness = externalError.match(/uniqueness=([\d.]+)/)?.[1];

        text = `Your audio was analyzed 
            • Score: ${score} — overall similarity score
            • Authenticity: ${authenticity} — how real your voice sounds
            • Ownership: ${ownership} — how consistent it is with your previous uploads
            • Quality: ${quality} — audio clarity and signal strength
            • Uniqueness: ${uniqueness} — how distinct your voice is

            Seems like the total score is below the threshold, so the audio was rejected  
            Try recording a clearer and more unique voice sample.`;
        }

    else if (err.includes("language"))
        text = "You must select the language of the audio before uploading";
    else if (err.includes("wallet"))
        text = "Please connect your wallet before uploading";
    else
        text = externalError;

    setMessage(text);
    setVisible(true);

    const timeout = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(timeout);
    }, [externalError]);

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
