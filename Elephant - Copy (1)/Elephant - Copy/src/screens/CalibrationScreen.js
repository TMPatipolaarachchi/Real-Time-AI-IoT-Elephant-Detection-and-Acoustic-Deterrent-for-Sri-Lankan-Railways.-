import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import pillarService from '../services/PillarService ';
import locationService from '../services/locationService';
import calibrationService from '../services/CalibrationService ';
import waypointService from '../services/WaypointService ';
import {
  COLORS, FONTS, SPACING, RADIUS, SHADOWS, COMMON, moderateScale, SCREEN,
} from '../theme';

export default function CalibrationScreen({ navigation }) {
  const [pillars, setPillars] = useState([]);
  const [waypoints, setWaypoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  // ESP32 Connection
  const [esp32Ip, setEsp32Ip] = useState('');
  const [connected, setConnected] = useState(false);
  
  // Bulk Import
  const [showImport, setShowImport] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');

  
  // Add Pillar states
  const [showAddPillar, setShowAddPillar] = useState(false);
  const [newPillarName, setNewPillarName] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');

  
  // Edit Pillar states
  const [showEditPillar, setShowEditPillar] = useState(false);
  const [editingPillar, setEditingPillar] = useState(null);
  const [editPillarName, setEditPillarName] = useState('');
  const [editPillarLat, setEditPillarLat] = useState('');
  const [editPillarLon, setEditPillarLon] = useState('');
  

  // Waypoints view states
  const [showWaypoints, setShowWaypoints] = useState(false);
  const [selectedPillarWaypoints, setSelectedPillarWaypoints] = useState([]);
  
  // Edit Waypoint states
  const [showEditWaypoint, setShowEditWaypoint] = useState(false);
  const [editingWaypoint, setEditingWaypoint] = useState(null);
  const [editWaypointDistance, setEditWaypointDistance] = useState('');
  const [editWaypointDescription, setEditWaypointDescription] = useState('');
  
  // Calibration states
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [targetDistance, setTargetDistance] = useState('1000');
  const [calibrationStatus, setCalibrationStatus] = useState(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [calibrationStartTime, setCalibrationStartTime] = useState(null);

  useEffect(() => {
    loadData();
    initLocation();
    checkConnection();
    
    const unsubscribe = calibrationService.addListener((status) => {
      setCalibrationStatus(status);
      setIsCalibrating(status.isCalibrating);
    });
    
    return () => {
      unsubscribe();
      if (calibrationService.isActive()) {
        calibrationService.stopCalibration();
      }
    };
  }, []);

  // Update screen every second during calibration
  useEffect(() => {
    let updateInterval;
    
    if (isCalibrating) {
      // Set start time when calibration begins
      if (!calibrationStartTime) {
        setCalibrationStartTime(Date.now());
      }
      
      updateInterval = setInterval(() => {
        // Force UI update by getting fresh status
        const status = calibrationService.getStatus();
        setCalibrationStatus(status);
        setUpdateTrigger(prev => prev + 1);
        
        // Update elapsed time
        if (calibrationStartTime) {
          const elapsed = Math.floor((Date.now() - calibrationStartTime) / 1000);
          setElapsedTime(elapsed);
        }
      }, 1000); // Update every 1 second
    } else {
      // Reset when calibration stops
      setCalibrationStartTime(null);
      setElapsedTime(0);
    }
    
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [isCalibrating, calibrationStartTime]);

  const loadData = async () => {
    try {
      const [pillarsData, waypointsData, ip] = await Promise.all([
        pillarService.getPillars(),
        waypointService.getWaypoints(),
        pillarService.getESP32IP(),
      ]);
      
      setPillars(pillarsData);
      setWaypoints(waypointsData);
      setEsp32Ip(ip);
    } catch (error) {
    }
  };

  const checkConnection = async () => {
    try {
      const status = await pillarService.checkConnection();
      setConnected(status !== null);
    } catch (error) {
      setConnected(false);
    }
  };

  const initLocation = async () => {
    const allowed = await locationService.requestPermissions();
    if (allowed) {
      const location = await locationService.getCurrentLocation();
      setCurrentLocation(location);
      
      // Watch location
      locationService.watchLocation((loc) => {
        setCurrentLocation(loc);
      }, 5000);
    }
  };

  const handleAddPillarHere = async () => {
    if (!currentLocation) {
      Alert.alert('Error', 'GPS location not available');
      return;
    }

    if (!newPillarName.trim()) {
      Alert.alert('Error', 'Please enter a pillar name');
      return;
    }

    setLoading(true);
    try {
      await pillarService.addPillar(
        newPillarName.trim(),
        currentLocation.latitude,
        currentLocation.longitude
      );
      
      Alert.alert('Success', `Pillar "${newPillarName}" added at current location`);
      setNewPillarName('');
      setShowAddPillar(false);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to add pillar: ' + error.message);
    }
    setLoading(false);
  };

  const handleAddPillarManual = async () => {
    if (!newPillarName.trim()) {
      Alert.alert('Error', 'Please enter a pillar name');
      return;
    }

    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);

    if (isNaN(lat) || isNaN(lon)) {
      Alert.alert('Error', 'Invalid coordinates');
      return;
    }

    setLoading(true);
    try {
      await pillarService.addPillar(newPillarName.trim(), lat, lon);
      
        Alert.alert('Success', `Pillar "${newPillarName}" added`);
      setNewPillarName('');
      setManualLat('');
      setManualLon('');
      setShowAddPillar(false);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to add pillar: ' + error.message);
    }
    setLoading(false);
  };

  const handleStartCalibration = async () => {
    if (!selectedPillar) {
      Alert.alert('Error', 'Please select a pillar to calibrate');
      return;
    }

    const distance = parseInt(targetDistance);
    if (isNaN(distance) || distance <= 0) {
      Alert.alert('Error', 'Invalid distance value');
      return;
    }

    try {
      await calibrationService.startCalibration(selectedPillar, distance);
      
      Alert.alert(
        'Calibration Started',
        `Keep phone STILL for 2.5 seconds, then START MOVING!\n\nWill record waypoints every ${distance}m for ${pillars.find(p => p.id === selectedPillar)?.name}\n\nWatch console for "Movement:" messages.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleStopCalibration = () => {
    const result = calibrationService.stopCalibration();
    Alert.alert(
      'Calibration Stopped',
      `Recorded ${result.waypointsRecorded} waypoints`
    );
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await pillarService.fetchPillars();
      await waypointService.fetchWaypoints();
      await loadData();
      await checkConnection();
      Alert.alert('Success', 'Data refreshed from ESP32');
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data: ' + error.message);
    }
    setLoading(false);
  };

  const handleUpdateIP = async () => {
    if (!esp32Ip) {
      Alert.alert('Error', 'Please enter ESP32 IP address');
      return;
    }
    
    try {
      await pillarService.setESP32IP(esp32Ip);
      await checkConnection();
      Alert.alert('Success', 'ESP32 IP updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update IP: ' + error.message);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkImportText.trim()) {
      Alert.alert('Error', 'Please enter data to import');
      return;
    }

    setLoading(true);
    try {
      const data = waypointService.parseSpreadsheet(bulkImportText);
      
      if (data.length === 0) {
        Alert.alert('Error', 'No valid data found. Please check format.');
        setLoading(false);
        return;
      }

      const response = await waypointService.bulkImport(data);
      
      if (response.status === 'success') {
        Alert.alert(
          'Success',
          `Imported ${response.addedPillars} pillars and ${response.addedWaypoints} waypoints`
        );
        setBulkImportText('');
        setShowImport(false);
        await loadData();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to import: ' + error.message);
    }
    setLoading(false);
  };

  const handleLoadSample = () => {
    const sample = waypointService.createSampleData();
    const formatted = sample.map(row => 
      `${row.index}\t${row.trackPathId}\t${row.latitude}\t${row.longitude}\t${row.pillerName}\t${row.front}\t${row.frontTotal}\t${row.back}\t${row.backTotal}`
    ).join('\n');
    
    setBulkImportText(`index\ttrackPathId\tlatitude\tlongitude\tpillerName\tfront\tfrontTotal\tback\tbackTotal\n${formatted}`);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Confirm Clear',
      'This will delete all pillars and waypoints from ESP32. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await pillarService.clearAll();
              await loadData();
              Alert.alert('Success', 'All data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear: ' + error.message);
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const handleEditPillar = (pillar) => {
    setEditingPillar(pillar);
    setEditPillarName(pillar.name);
    setEditPillarLat(pillar.lat.toString());
    setEditPillarLon(pillar.lon.toString());
    setShowEditPillar(true);
  };

  const handleUpdatePillar = async () => {
    if (!editPillarName.trim()) {
      Alert.alert('Error', 'Please enter a pillar name');
      return;
    }

    const lat = parseFloat(editPillarLat);
    const lon = parseFloat(editPillarLon);

    if (isNaN(lat) || isNaN(lon)) {
      Alert.alert('Error', 'Invalid coordinates');
      return;
    }

    setLoading(true);
    try {
      // Delete old pillar and add updated one
      await pillarService.deletePillar(editingPillar.id);
      await pillarService.addPillar(editPillarName.trim(), lat, lon);
      
      Alert.alert('Success', 'Pillar updated');
      setShowEditPillar(false);
      setEditingPillar(null);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update pillar: ' + error.message);
    }
    setLoading(false);
  };

  const handleDeletePillar = (pillar) => {
    Alert.alert(
      'Delete Pillar',
      `Are you sure you want to delete "${pillar.name}"? This will also delete all its waypoints.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await pillarService.deletePillar(pillar.id);
              Alert.alert('Success', 'Pillar deleted');
              await loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete pillar: ' + error.message);
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const handleViewWaypoints = (pillar) => {
    const pillarWaypoints = waypoints.filter(wp => 
      wp.pillarId === pillar.id || wp.pillerName === pillar.name
    );
    setSelectedPillarWaypoints(pillarWaypoints);
    setShowWaypoints(true);
  };

  const handleDeleteWaypoint = (waypoint) => {
    Alert.alert(
      'Delete Waypoint',
      'Are you sure you want to delete this waypoint?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await waypointService.deleteWaypoint(waypoint.id);
              Alert.alert('Success', 'Waypoint deleted');
              await loadData();
              // Refresh the waypoints view if open
              if (showWaypoints) {
                const updatedWaypoints = selectedPillarWaypoints.filter(wp => wp.id !== waypoint.id);
                setSelectedPillarWaypoints(updatedWaypoints);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete waypoint: ' + error.message);
            }
            setLoading(false);
          },
        },
      ]
    );
  };

  const handleEditWaypoint = (waypoint) => {
    setEditingWaypoint(waypoint);
    setEditWaypointDistance(waypoint.distanceFromPillar?.toString() || '0');
    setEditWaypointDescription(waypoint.description || '');
    setShowEditWaypoint(true);
  };

  const handleSaveWaypoint = async () => {
    if (!editingWaypoint) return;

    const distance = parseFloat(editWaypointDistance);
    if (isNaN(distance)) {
      Alert.alert('Error', 'Invalid distance value');
      return;
    }

    setLoading(true);
    try {
      await waypointService.updateWaypoint(
        editingWaypoint.id,
        distance,
        editWaypointDescription
      );
      
      Alert.alert('Success', 'Waypoint updated');
      setShowEditWaypoint(false);
      await loadData();
      
      // Refresh waypoints list if modal is open
      if (showWaypoints) {
        const pillarId = editingWaypoint.pillarId || editingWaypoint.pillerName;
        const updatedWaypoints = waypoints.filter(wp => 
          (wp.pillarId === pillarId || wp.pillerName === pillarId)
        );
        setSelectedPillarWaypoints(updatedWaypoints);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update waypoint: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={moderateScale(22)} color={COLORS.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calibration & Pillars</Text>
        <View style={[styles.statusDot, connected && styles.statusConnected]} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* ESP32 Connection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="wifi" size={moderateScale(18)} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>ESP32 Connection</Text>
          </View>
          <View style={styles.ipRow}>
            <TextInput style={styles.ipInput} value={esp32Ip} onChangeText={setEsp32Ip} placeholder="192.168.1.100" placeholderTextColor={COLORS.textTertiary} keyboardType="numeric" />
            <TouchableOpacity onPress={handleUpdateIP} style={styles.updateButton} activeOpacity={0.8}>
              <Text style={styles.updateButtonText}>Update</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.connectionStatus}>
            <Ionicons name={connected ? "checkmark-circle" : "close-circle"} size={moderateScale(14)} color={connected ? COLORS.success : COLORS.danger} />
            <Text style={[styles.connectionText, { color: connected ? COLORS.success : COLORS.textTertiary }]}>
              {connected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={moderateScale(18)} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <TouchableOpacity onPress={handleRefresh} style={styles.actionButton} disabled={loading} activeOpacity={0.8}>
            <Ionicons name="refresh" size={moderateScale(16)} color={COLORS.textInverse} />
            <Text style={styles.actionButtonText}>Refresh from ESP32</Text>
          </TouchableOpacity>
        </View>

        {/* Bulk Import */}
        {showImport && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cloud-upload" size={moderateScale(18)} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Bulk Import Data</Text>
            </View>
            <Text style={styles.helpText}>
              Paste spreadsheet data (tab or comma separated).{'\n'}Format: index, trackPathId, latitude, longitude, pillerName, front, frontTotal, back, backTotal
            </Text>
            <TextInput style={styles.importTextInput} value={bulkImportText} onChangeText={setBulkImportText} placeholder="Paste your data here..." placeholderTextColor={COLORS.textTertiary} multiline numberOfLines={10} />
            <View style={styles.importButtonRow}>
              <TouchableOpacity onPress={handleLoadSample} style={styles.sampleButton} activeOpacity={0.8}>
                <Text style={styles.sampleButtonText}>Load Sample</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleBulkImport} style={styles.importSubmitButton} disabled={loading} activeOpacity={0.8}>
                <Text style={styles.importSubmitText}>Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Statistics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart" size={moderateScale(18)} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Statistics</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{pillars.length}</Text>
              <Text style={styles.statLabel}>Pillars</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{waypoints.length}</Text>
              <Text style={styles.statLabel}>Waypoints</Text>
            </View>
          </View>
        </View>

        {/* Current Location */}
        {currentLocation && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="navigate" size={moderateScale(18)} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Current Location</Text>
            </View>
            <Text style={styles.locationText}>
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        {/* Add Pillar */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="add-circle" size={moderateScale(18)} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Add New Pillar</Text>
          </View>
          <TouchableOpacity onPress={() => setShowAddPillar(true)} style={styles.addButton} activeOpacity={0.8}>
            <Ionicons name="add" size={moderateScale(18)} color={COLORS.textInverse} />
            <Text style={styles.addButtonText}>Add Pillar</Text>
          </TouchableOpacity>
        </View>

        {/* Calibration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="speedometer" size={moderateScale(18)} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Calibrate Waypoints</Text>
          </View>
          {!isCalibrating ? (
            <>
              <Text style={styles.label}>Select Pillar:</Text>
              <View style={styles.pillarSelector}>
                {pillars.map((pillar) => (
                  <TouchableOpacity key={pillar.id} style={[styles.pillarChip, selectedPillar === pillar.id && styles.pillarChipSelected]} onPress={() => setSelectedPillar(pillar.id)} activeOpacity={0.7}>
                    <Text style={[styles.pillarChipText, selectedPillar === pillar.id && styles.pillarChipTextSelected]}>{pillar.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Distance per Waypoint (meters):</Text>
              <TextInput style={styles.input} value={targetDistance} onChangeText={setTargetDistance} placeholder="1000" placeholderTextColor={COLORS.textTertiary} keyboardType="numeric" />
              <Text style={styles.helpText}>Waypoints will be recorded every {targetDistance}m while the train moves</Text>
              <TouchableOpacity onPress={handleStartCalibration} style={styles.calibrateButton} disabled={!selectedPillar || loading} activeOpacity={0.8}>
                <Ionicons name="train" size={moderateScale(16)} color={COLORS.textInverse} />
                <Text style={styles.calibrateButtonText}>Start Calibration</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.calibrationActive}>
              <View style={styles.calibrationHeader}>
                <View style={styles.liveIndicatorDot} />
                <Text style={styles.calibrationTitle}>Calibration Active</Text>
              </View>
              <Text style={styles.calibrationPillar}>Pillar: {pillars.find(p => p.id === selectedPillar)?.name}</Text>
              <View style={styles.timeContainer}>
                <Ionicons name="timer-outline" size={moderateScale(18)} color={COLORS.accent} />
                <Text style={styles.timeValue}>{Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}</Text>
              </View>
              {calibrationStatus && (
                <View style={styles.calibrationStats}>
                  <View style={styles.statRow}><Text style={styles.statRowLabel}>Real Distance:</Text><Text style={styles.statRowValue}>{calibrationStatus.realDistance.toFixed(0)}m / {calibrationStatus.targetDistance}m</Text></View>
                  <View style={styles.statRow}><Text style={styles.statRowLabel}>Straight Distance:</Text><Text style={styles.statRowValue}>{calibrationStatus.straightDistance.toFixed(0)}m</Text></View>
                  <View style={styles.statRow}><Text style={styles.statRowLabel}>Waypoints:</Text><Text style={styles.statRowValue}>{calibrationStatus.waypointsRecorded}</Text></View>
                  <View style={styles.statRow}><Text style={styles.statRowLabel}>Velocity:</Text><Text style={styles.statRowValue}>{calibrationStatus.velocity?.toFixed(2) || '0.00'} m/s</Text></View>
                  <View style={styles.statRow}>
                    <Text style={styles.statRowLabel}>Calibrated:</Text>
                    <Text style={[styles.statRowValue, { color: calibrationStatus.isCalibrated ? COLORS.success : COLORS.danger }]}>
                      {calibrationStatus.isCalibrated ? 'Yes' : 'No'}
                    </Text>
                  </View>
                  <View style={styles.liveRow}>
                    <View style={styles.liveIndicatorDotSmall} />
                    <Text style={styles.liveText}>Live Update (Every 1s)</Text>
                  </View>
                </View>
              )}
              <TouchableOpacity onPress={handleStopCalibration} style={styles.stopButton} activeOpacity={0.8}>
                <Ionicons name="stop-circle" size={moderateScale(16)} color={COLORS.textInverse} />
                <Text style={styles.stopButtonText}>Stop Calibration</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Pillars List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={moderateScale(18)} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Available Pillars ({pillars.length})</Text>
          </View>
          {pillars.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="compass-outline" size={moderateScale(36)} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>No pillars yet. Add one to get started.</Text>
            </View>
          ) : (
            pillars.map((pillar) => (
              <View key={pillar.id} style={styles.pillarItem}>
                <View style={styles.pillarInfo}>
                  <Text style={styles.pillarItemName}>{pillar.name}</Text>
                  <Text style={styles.pillarItemCoords}>{pillar.lat.toFixed(6)}, {pillar.lon.toFixed(6)}</Text>
                  <Text style={styles.pillarItemWaypoints}>{waypoints.filter(wp => wp.pillarId === pillar.id || wp.pillerName === pillar.name).length} waypoints</Text>
                </View>
                <View style={styles.pillarActions}>
                  <TouchableOpacity onPress={() => handleViewWaypoints(pillar)} style={styles.iconBtn} activeOpacity={0.7}><Ionicons name="eye-outline" size={moderateScale(18)} color={COLORS.info} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleEditPillar(pillar)} style={styles.iconBtn} activeOpacity={0.7}><Ionicons name="create-outline" size={moderateScale(18)} color={COLORS.accent} /></TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeletePillar(pillar)} style={styles.iconBtn} activeOpacity={0.7}><Ionicons name="trash-outline" size={moderateScale(18)} color={COLORS.danger} /></TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Add Pillar Modal */}
      <Modal visible={showAddPillar} animationType="slide" transparent onRequestClose={() => setShowAddPillar(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Pillar</Text>
            <Text style={styles.label}>Pillar Name:</Text>
            <TextInput style={styles.input} value={newPillarName} onChangeText={setNewPillarName} placeholder="e.g., Pillar A" placeholderTextColor={COLORS.textTertiary} />
            <TouchableOpacity onPress={handleAddPillarHere} style={styles.primaryButton} disabled={loading || !currentLocation} activeOpacity={0.8}>
              <Ionicons name="navigate" size={moderateScale(16)} color={COLORS.textInverse} />
              <Text style={styles.primaryButtonText}>Add at Current Location</Text>
            </TouchableOpacity>
            <View style={styles.orDivider}><View style={styles.orLine} /><Text style={styles.orText}>OR</Text><View style={styles.orLine} /></View>
            <Text style={styles.label}>Manual Coordinates:</Text>
            <TextInput style={styles.input} value={manualLat} onChangeText={setManualLat} placeholder="Latitude" placeholderTextColor={COLORS.textTertiary} keyboardType="decimal-pad" />
            <TextInput style={styles.input} value={manualLon} onChangeText={setManualLon} placeholder="Longitude" placeholderTextColor={COLORS.textTertiary} keyboardType="decimal-pad" />
            <TouchableOpacity onPress={handleAddPillarManual} style={styles.secondaryButton} disabled={loading} activeOpacity={0.8}>
              <Text style={styles.secondaryButtonText}>Add with Manual Coordinates</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAddPillar(false)} style={styles.cancelButton} activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Pillar Modal */}
      <Modal visible={showEditPillar} animationType="slide" transparent onRequestClose={() => setShowEditPillar(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Pillar</Text>
            <Text style={styles.label}>Pillar Name:</Text>
            <TextInput style={styles.input} value={editPillarName} onChangeText={setEditPillarName} placeholder="e.g., Pillar A" placeholderTextColor={COLORS.textTertiary} />
            <Text style={styles.label}>Latitude:</Text>
            <TextInput style={styles.input} value={editPillarLat} onChangeText={setEditPillarLat} placeholder="Latitude" placeholderTextColor={COLORS.textTertiary} keyboardType="decimal-pad" />
            <Text style={styles.label}>Longitude:</Text>
            <TextInput style={styles.input} value={editPillarLon} onChangeText={setEditPillarLon} placeholder="Longitude" placeholderTextColor={COLORS.textTertiary} keyboardType="decimal-pad" />
            <TouchableOpacity onPress={handleUpdatePillar} style={styles.primaryButton} disabled={loading} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Update Pillar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowEditPillar(false)} style={styles.cancelButton} activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Waypoints Modal */}
      <Modal visible={showWaypoints} animationType="slide" transparent onRequestClose={() => setShowWaypoints(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>Waypoints ({selectedPillarWaypoints.length})</Text>
            <ScrollView style={styles.waypointsScroll} showsVerticalScrollIndicator={false}>
              {selectedPillarWaypoints.length === 0 ? (
                <View style={styles.emptyContainer}><Text style={styles.emptyText}>No waypoints for this pillar</Text></View>
              ) : (
                selectedPillarWaypoints.map((waypoint, index) => (
                  <View key={waypoint.id || index} style={styles.waypointCard}>
                    <View style={styles.waypointInfo}>
                      <Text style={styles.waypointTitle}>Waypoint {waypoint.index || index + 1}</Text>
                      <Text style={styles.waypointCoords}>Lat: {waypoint.lat?.toFixed(6) || 'N/A'}</Text>
                      <Text style={styles.waypointCoords}>Lon: {waypoint.lon?.toFixed(6) || 'N/A'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteWaypoint(waypoint)} style={styles.iconBtn} activeOpacity={0.7}>
                      <Ionicons name="trash-outline" size={moderateScale(18)} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity onPress={() => setShowWaypoints(false)} style={styles.primaryButton} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Waypoint Modal */}
      <Modal visible={showEditWaypoint} animationType="slide" transparent onRequestClose={() => setShowEditWaypoint(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Waypoint</Text>
            <Text style={styles.label}>Distance from Pillar (meters):</Text>
            <TextInput style={styles.input} value={editWaypointDistance} onChangeText={setEditWaypointDistance} placeholder="0" placeholderTextColor={COLORS.textTertiary} keyboardType="numeric" />
            <Text style={styles.helpText}>Negative = before pillar, Positive = after pillar</Text>
            <Text style={styles.label}>Description:</Text>
            <TextInput style={styles.input} value={editWaypointDescription} onChangeText={setEditWaypointDescription} placeholder="Waypoint description" placeholderTextColor={COLORS.textTertiary} />
            <View style={styles.modalButtonRow}>
              <TouchableOpacity onPress={() => setShowEditWaypoint(false)} style={styles.cancelButtonModal} activeOpacity={0.7}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveWaypoint} style={styles.saveButton} disabled={loading} activeOpacity={0.8}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.md,
    backgroundColor: COLORS.primaryDark, ...SHADOWS.md,
  },
  backButton: { padding: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.1)' },
  headerTitle: { fontSize: moderateScale(17), fontWeight: '700', color: COLORS.textInverse, letterSpacing: 0.3 },
  statusDot: { width: moderateScale(10), height: moderateScale(10), borderRadius: moderateScale(5), backgroundColor: COLORS.danger },
  statusConnected: { backgroundColor: COLORS.success },

  scrollView: { flex: 1 },
  contentContainer: { padding: SPACING.base, paddingBottom: SPACING['3xl'] },

  // Section Card
  section: { ...COMMON.card, marginBottom: SPACING.base },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  sectionTitle: { ...FONTS.h4, color: COLORS.primary },

  // Connection
  ipRow: { flexDirection: 'row', marginBottom: SPACING.sm },
  ipInput: {
    flex: 1, ...COMMON.inputField, marginRight: SPACING.sm,
  },
  updateButton: {
    backgroundColor: COLORS.info, paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg, justifyContent: 'center', ...SHADOWS.colored(COLORS.info),
  },
  updateButtonText: { color: COLORS.textInverse, fontWeight: '700', fontSize: moderateScale(13) },
  connectionStatus: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  connectionText: { fontSize: moderateScale(12), fontWeight: '600' },

  // Actions
  actionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, backgroundColor: COLORS.info,
    padding: SPACING.md, borderRadius: RADIUS.lg, ...SHADOWS.colored(COLORS.info),
  },
  actionButtonText: { color: COLORS.textInverse, fontSize: moderateScale(14), fontWeight: '700' },

  // Stats
  statsRow: { flexDirection: 'row', gap: SPACING.md },
  statCard: {
    flex: 1, backgroundColor: COLORS.primarySurface, borderRadius: RADIUS.lg,
    padding: SPACING.lg, alignItems: 'center',
  },
  statNumber: { fontSize: moderateScale(32), fontWeight: '800', color: COLORS.primary },
  statLabel: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: SPACING.xs },

  // Location
  locationText: { ...FONTS.mono },

  // Add Button
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, backgroundColor: COLORS.success,
    padding: SPACING.base, borderRadius: RADIUS.lg, ...SHADOWS.colored(COLORS.success),
  },
  addButtonText: { color: COLORS.textInverse, fontSize: moderateScale(15), fontWeight: '700' },

  // Form
  label: { ...FONTS.bodyBold, marginBottom: SPACING.sm, marginTop: SPACING.md },
  input: { ...COMMON.inputField, marginBottom: SPACING.sm },
  helpText: { ...FONTS.caption, fontStyle: 'italic', marginBottom: SPACING.base, color: COLORS.textTertiary },

  // Pillar Selector Chips
  pillarSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  pillarChip: {
    backgroundColor: COLORS.background, paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm, borderRadius: RADIUS.full,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  pillarChipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pillarChipText: { fontSize: moderateScale(13), fontWeight: '600', color: COLORS.textSecondary },
  pillarChipTextSelected: { color: COLORS.textInverse },

  // Calibrate Button
  calibrateButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, backgroundColor: COLORS.accent,
    padding: SPACING.base, borderRadius: RADIUS.lg, marginTop: SPACING.sm,
    ...SHADOWS.colored(COLORS.accent),
  },
  calibrateButtonText: { color: COLORS.textInverse, fontSize: moderateScale(15), fontWeight: '700' },

  // Calibration Active
  calibrationActive: {
    backgroundColor: COLORS.accentSurface, padding: SPACING.base,
    borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.accent,
  },
  calibrationHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  calibrationTitle: { fontSize: moderateScale(17), fontWeight: '700', color: COLORS.accentDark },
  calibrationPillar: { ...FONTS.body, textAlign: 'center', marginBottom: SPACING.md },
  calibrationStats: {
    backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.base,
  },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  statRowLabel: { ...FONTS.body, color: COLORS.textTertiary },
  statRowValue: { ...FONTS.bodyBold },
  timeContainer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: SPACING.sm, backgroundColor: COLORS.accentSurface,
    padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md,
  },
  timeValue: { fontSize: moderateScale(22), fontWeight: '800', color: COLORS.accentDark, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  liveIndicatorDot: { width: moderateScale(10), height: moderateScale(10), borderRadius: moderateScale(5), backgroundColor: COLORS.danger },
  liveIndicatorDotSmall: { width: moderateScale(6), height: moderateScale(6), borderRadius: moderateScale(3), backgroundColor: COLORS.success },
  liveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, marginTop: SPACING.sm },
  liveText: { ...FONTS.caption, color: COLORS.success, fontWeight: '600' },

  // Stop Button
  stopButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, backgroundColor: COLORS.danger,
    padding: SPACING.base, borderRadius: RADIUS.lg, ...SHADOWS.colored(COLORS.danger),
  },
  stopButtonText: { color: COLORS.textInverse, fontSize: moderateScale(15), fontWeight: '700' },

  // Pillar Items
  pillarItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  pillarInfo: { flex: 1 },
  pillarItemName: { ...FONTS.bodyBold, color: COLORS.text },
  pillarItemCoords: { ...FONTS.caption, marginTop: SPACING.xs },
  pillarItemWaypoints: { fontSize: moderateScale(11), color: COLORS.info, fontWeight: '600', marginTop: SPACING.xs },
  pillarActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  iconBtn: { padding: SPACING.sm, borderRadius: RADIUS.md },

  // Empty
  emptyContainer: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyText: { ...FONTS.body, color: COLORS.textTertiary, fontStyle: 'italic', marginTop: SPACING.sm },

  // Modals
  modalOverlay: { ...COMMON.modalOverlay },
  modalContent: { ...COMMON.modalContent },
  modalContentLarge: { ...COMMON.modalContentLarge },
  modalTitle: { ...FONTS.h2, textAlign: 'center', marginBottom: SPACING.base },
  waypointsScroll: { maxHeight: moderateScale(350), marginBottom: SPACING.base },

  // Modal Buttons
  primaryButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, backgroundColor: COLORS.primary,
    padding: SPACING.base, borderRadius: RADIUS.lg, marginTop: SPACING.sm,
    ...SHADOWS.colored(COLORS.primary),
  },
  primaryButtonText: { color: COLORS.textInverse, fontSize: moderateScale(14), fontWeight: '700' },
  secondaryButton: {
    backgroundColor: COLORS.info, padding: SPACING.base,
    borderRadius: RADIUS.lg, alignItems: 'center', marginTop: SPACING.sm,
    ...SHADOWS.colored(COLORS.info),
  },
  secondaryButtonText: { color: COLORS.textInverse, fontSize: moderateScale(14), fontWeight: '700' },
  cancelButton: { padding: SPACING.base, alignItems: 'center', marginTop: SPACING.sm },
  cancelButtonText: { color: COLORS.textTertiary, fontSize: moderateScale(14), fontWeight: '600' },
  cancelButtonModal: {
    flex: 1, backgroundColor: COLORS.background, borderRadius: RADIUS.lg,
    padding: SPACING.md, alignItems: 'center', marginRight: SPACING.sm,
  },
  saveButton: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    padding: SPACING.md, alignItems: 'center',
  },
  saveButtonText: { color: COLORS.textInverse, fontSize: moderateScale(14), fontWeight: '700' },
  modalButtonRow: { flexDirection: 'row', marginTop: SPACING.base },

  // OR Divider
  orDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.base },
  orLine: { flex: 1, height: 1, backgroundColor: COLORS.divider },
  orText: { marginHorizontal: SPACING.md, color: COLORS.textTertiary, fontSize: moderateScale(12), fontWeight: '600' },

  // Import
  importTextInput: {
    ...COMMON.inputField, minHeight: moderateScale(120), textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: moderateScale(11),
    marginBottom: SPACING.sm,
  },
  importButtonRow: { flexDirection: 'row', gap: SPACING.sm },
  sampleButton: {
    flex: 1, backgroundColor: COLORS.textTertiary, padding: SPACING.md,
    borderRadius: RADIUS.lg, alignItems: 'center',
  },
  sampleButtonText: { color: COLORS.textInverse, fontWeight: '600', fontSize: moderateScale(13) },
  importSubmitButton: {
    flex: 1, backgroundColor: COLORS.success, padding: SPACING.md,
    borderRadius: RADIUS.lg, alignItems: 'center',
  },
  importSubmitText: { color: COLORS.textInverse, fontWeight: '700', fontSize: moderateScale(13) },

  // Waypoint Card
  waypointCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.background, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.sm,
  },
  waypointInfo: { flex: 1 },
  waypointTitle: { ...FONTS.bodyBold, marginBottom: SPACING.xs },
  waypointCoords: { ...FONTS.caption },

  // Loading
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: COLORS.overlay, justifyContent: 'center', alignItems: 'center',
  },
  loadingCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING['2xl'], alignItems: 'center', ...SHADOWS.xl },
  loadingText: { ...FONTS.body, marginTop: SPACING.md },
});