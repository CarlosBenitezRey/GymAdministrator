import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, StatusBar, View } from 'react-native';
import { AccessScreen } from './src/screens/AccessScreen';
import { ReceptionScreen } from './src/screens/ReceptionScreen';
import { StudentsScreen } from './src/screens/StudentsScreen';

export default function App() {
  const [currentFlow, setCurrentFlow] = useState<'access' | 'reception'>('access');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.screenContainer}>
        {currentFlow === 'access' ? (
          <AccessScreen onOpenStaff={() => setCurrentFlow('reception')} />
        ) : (
          <ReceptionScreen onExitToAccess={() => setCurrentFlow('access')} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  screenContainer: {
    flex: 1,
  },
});
