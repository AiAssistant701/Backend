import speech_recognition as sr

recognizer = sr.Recognizer()

def convert_speech_to_text(audio_file):
    """Converts audio speech to text using speech recognition."""
    with sr.AudioFile(audio_file) as source:
        audio = recognizer.record(source)
    return recognizer.recognize_google(audio)
