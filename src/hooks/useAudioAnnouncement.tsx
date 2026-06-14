import { useCallback, useState } from "react";

const findVoiceForLanguage = (lang: string) => {
  if (!("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  const normalizedLang = lang.toLowerCase();
  const shortLang = normalizedLang.split("-")[0];

  return (
    voices.find((voice) => voice.lang.toLowerCase() === normalizedLang) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith(`${shortLang}-`)) ||
    voices.find((voice) => voice.lang.toLowerCase().startsWith(shortLang)) ||
    null
  );
};

export const useAudioAnnouncement = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  const speak = useCallback(
    (text: string, lang: string = "en-IN", cancelCurrent: boolean = true) => {
      if (!isEnabled || !("speechSynthesis" in window)) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        if (cancelCurrent) {
          window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = findVoiceForLanguage(lang);

        utterance.lang = lang;
        utterance.rate = 0.9;
        utterance.pitch = 1;

        if (voice) {
          utterance.voice = voice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      });
    },
    [isEnabled]
  );

  const announceToken = useCallback(
    async (
      tokenNumber: number,
      counterNumber: number,
      patientName: string,
      doctorName?: string,
      roomNumber?: string
    ) => {
      const englishDoctorPart = doctorName ? ` for Doctor ${doctorName}` : "";
      const englishRoomPart = roomNumber ? ` in ${roomNumber}` : "";
      const hindiDoctorPart = doctorName ? ` डॉक्टर ${doctorName} के लिए` : "";
      const hindiRoomPart = roomNumber ? `, ${roomNumber}` : "";

      const englishMessage = `Attention please. Patient ${patientName}. Token number ${tokenNumber}. Please proceed to counter ${counterNumber}${englishRoomPart}${englishDoctorPart}. Thank you.`;
      const hindiMessage = `कृपया ध्यान दें, मरीज ${patientName}, टोकन नंबर ${tokenNumber},${hindiDoctorPart} काउंटर ${counterNumber}${hindiRoomPart} पर आएं। धन्यवाद।`;

      await speak(englishMessage, "en-IN", true);
      await speak(hindiMessage, "hi-IN", false);
    },
    [speak]
  );

  const toggleAudio = () => setIsEnabled(!isEnabled);

  return { speak, announceToken, isSpeaking, isEnabled, toggleAudio };
};
