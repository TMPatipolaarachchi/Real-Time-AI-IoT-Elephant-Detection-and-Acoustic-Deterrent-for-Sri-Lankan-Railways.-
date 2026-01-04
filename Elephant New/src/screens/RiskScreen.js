import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { predictRisk } from '../services/RiskService';

const RiskScreen = () => {
  // --- INPUT STATES ---
  const [distance, setDistance] = useState('2');
  const [speed, setSpeed] = useState('30');
  const [behavior, setBehavior] = useState('calm');
  const [count, setCount] = useState('9');
  const [structure, setStructure] = useState('family');
  const [weather, setWeather] = useState('dry');

  const [risk, setRisk] = useState(null);

  const handlePress = () => {
    // We now pass the STATE variables instead of fixed values
    const result = predictRisk(
      parseFloat(distance), 
      parseFloat(speed), 
      behavior, 
      parseInt(count), 
      structure, 
      weather
    );
    
    setRisk(result);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Elephant Risk Input</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Distance (km)</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={distance} onChangeText={setDistance} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Train Speed (km/h)</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={speed} onChangeText={setSpeed} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Behavior (calm / aggressive)</Text>
        <TextInput style={styles.input} value={behavior} onChangeText={setBehavior} autoCapitalize="none" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Elephant Count</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={count} onChangeText={setCount} />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Social (family / herd / single)</Text>
        <TextInput style={styles.input} value={structure} onChangeText={setStructure} autoCapitalize="none" />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Weather (dry / rainy)</Text>
        <TextInput style={styles.input} value={weather} onChangeText={setWeather} autoCapitalize="none" />
      </View>

      <TouchableOpacity style={styles.calculateBtn} onPress={handlePress}>
        <Text style={styles.btnText}>CALCULATE RISK</Text>
      </TouchableOpacity>

      {risk && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Calculated Risk:</Text>
          <Text style={[styles.riskValue, { color: risk.toLowerCase() === 'high' ? 'red' : 'orange' }]}>
            {risk.toUpperCase()}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f5f5f5' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
  inputGroup: { marginBottom: 15, backgroundColor: '#fff', padding: 10, borderRadius: 8 },
  label: { fontSize: 14, color: '#666', marginBottom: 5 },
  input: { borderBottomWidth: 1, borderBottomColor: '#2196F3', fontSize: 18, paddingVertical: 5 },
  calculateBtn: { backgroundColor: '#2196F3', padding: 15, borderRadius: 8, marginTop: 20, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  resultContainer: { marginTop: 30, padding: 20, backgroundColor: '#fff', borderRadius: 10, alignItems: 'center', elevation: 3 },
  resultLabel: { fontSize: 16, color: '#888' },
  riskValue: { fontSize: 32, fontWeight: 'bold', marginTop: 5 }
});

export default RiskScreen;