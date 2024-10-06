import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Modal, Pressable, StatusBar } from 'react-native';
import { Button } from '@rneui/themed'; // Importiere den Button von React Native Elements
import { LinearGradient } from 'expo-linear-gradient'; // Importiere LinearGradient von Expo
import { Picker } from '@react-native-picker/picker';
import { Audio } from 'expo-av';

const HomeScreen = () => {
  const [sound, setSound] = useState();
  const [selectedSound, setSelectedSound] = useState('Stille');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState('10');
  const [timeLeft, setTimeLeft] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const timerRef = useRef(null);

  const soundFiles = {
    "Stille": null,
    "Alphawellen": require('./assets/alphawellen.mp3'),
    "Deep Space": require('./assets/deepspace.mp3'),
    "Wald": require('./assets/forest.mp3'),
  };

  const playSound = async () => {
    if (selectedSound && soundFiles[selectedSound]) {
      try {
        const { sound } = await Audio.Sound.createAsync(soundFiles[selectedSound], { shouldPlay: true, isLooping: true });
        setSound(sound);
        setIsPlaying(true);
      } catch (error) {
        console.error("Error loading sound:", error); // Fehlermeldung loggen
        alert('Fehler beim Laden der Audiodatei.');
      }
    }
  };

  const stopSound = async () => {
    if (sound) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (error) {
        console.error("Error stopping/unloading sound:", error);
      }
      setSound(null);
    }
    setIsPlaying(false);
  };

  const startTimer = (durationMinutes) => {
    setTimeLeft(durationMinutes * 60);
    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime === 1) {
          clearInterval(timerRef.current);
          stopSound();
          setModalVisible(false); // Modal schließen
          alert('Die Meditation ist beendet!');
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  const startMeditation = async () => {
    const durationMinutes = parseInt(duration);
    if (isNaN(durationMinutes) || durationMinutes <= 0) {
      alert('Bitte gib eine gültige Dauer in Minuten ein.');
      return;
    }

    if (durationMinutes > 0) {
      startTimer(durationMinutes);
    }

    if (selectedSound !== 'Stille') {
      await playSound();
    } else {
      setIsPlaying(true);
    }

    setModalVisible(true);
  };

  const manualStopMeditation = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    stopSound();
    setTimeLeft(null);
    setModalVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {/* StatusBar-Komponente */}
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.content}>
        <Text style={styles.label}>Dauer in Minuten</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={duration}
          onChangeText={setDuration}
          placeholder="z.B. 5"
        />

        <Text style={styles.label}>Atmosphäre</Text>
        <Picker
          selectedValue={selectedSound}
          style={styles.picker}
          onValueChange={(itemValue) => {
            setSelectedSound(itemValue);
            if (isPlaying) {
              manualStopMeditation();
            }
          }}
        >
          {Object.keys(soundFiles).map((soundName) => (
            <Picker.Item label={soundName} value={soundName} key={soundName} />
          ))}
        </Picker>

        {!isPlaying && (
          <Button
            ViewComponent={LinearGradient} // Gradient-Komponente
            linearGradientProps={{
              colors: ["#FF9800", "#F44336"], // Farben des Gradienten
              start: { x: 0, y: 0.5 },
              end: { x: 1, y: 0.5 },
            }}
            buttonStyle={styles.playButton} // Style des Buttons
            onPress={startMeditation}
          >
            <Text style={styles.buttonText}>Starten</Text>
          </Button>
        )}

        {isPlaying && timeLeft !== null && (
          <View style={styles.meditationContainer}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          </View>
        )}
      </View>

      {/* Modal */}
      <Modal
        animationType="fade"
        transparent={false}
        visible={modalVisible}
        onRequestClose={manualStopMeditation}
      >
        <Pressable style={styles.modalContainer} onPress={manualStopMeditation}>
          <Text style={styles.modalTimer}>{formatTime(timeLeft)}</Text>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  content: {
    marginTop: 24,
  },
  label: {
    fontSize: 18,
    marginVertical: 10,
    color: '#fff',
    alignSelf: 'center',
    marginTop: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    width: '70%',
    alignSelf: 'center',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
    color: 'white',
    backgroundColor: '#333',
  },
  picker: {
    height: 50,
    width: '70%',
    alignSelf: 'center',
    color: 'white',
    backgroundColor: '#333',
    borderRadius: 5,
    fontSize: 16,
    padding: 10,
    marginBottom: 24,
  },
  playButton: {
    borderRadius: 30,
    width: 200,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  modalTimer: {
    fontSize: 60, // Festere Größe verwenden
    color: '#fff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  meditationContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 24,
    color: '#fff',
  },
});

export default HomeScreen;
