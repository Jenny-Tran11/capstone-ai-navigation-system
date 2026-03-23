import platform
import os
import sys

# Try importing pyttsx3 for Windows compatibility
try:
    import pyttsx3
    PYTTSX3_AVAILABLE = True
except ImportError:
    PYTTSX3_AVAILABLE = False

class VoiceAssistant:
    def __init__(self):
        # Detect operating system: 'Darwin' is macOS, 'Windows' is Windows
        self.system = platform.system()
        self.engine = None
        
        # Initialize pyttsx3 only on Windows to avoid conflicts on macOS
        if self.system == 'Windows' and PYTTSX3_AVAILABLE:
            try:
                self.engine = pyttsx3.init()
                self.engine.setProperty('rate', 160)
            except Exception as e:
                print(f"TTS Init Error: {e}")

    def speak(self, text):
        """
        Cross-platform speech function.
        Uses native 'say' command on macOS and pyttsx3 on Windows.
        """
        if not text:
            return

        print(f"[Audio Output]: {text}")

        if self.system == 'Darwin':
            # --- macOS Specific Solution ---
            # Use the native 'say' command. 
            # This bypasses the pyttsx3 event loop bug entirely.
            
            # Sanitize text to avoid shell command errors
            safe_text = text.replace('"', '').replace("'", "")
            
            # Execute system command
            os.system(f'say "{safe_text}"')
            
        elif self.system == 'Windows':
            # --- Windows Solution ---
            if self.engine:
                try:
                    self.engine.say(text)
                    self.engine.runAndWait()
                except Exception as e:
                    print(f"Windows TTS Error: {e}")
                    # Re-initialize if engine crashed
                    self.engine = pyttsx3.init()
        else:
            # Linux or other systems
            print("System audio not fully supported. Text logged to console only.")