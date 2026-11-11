import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  BackHandler,
  ToastAndroid,
  Platform,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Modal
} from 'react-native';
import { WebView } from 'react-native-webview';

const DEFAULT_CLOUD_URL = 'https://parentcare360-web.onrender.com';

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(DEFAULT_CLOUD_URL);
  const [inputUrl, setInputUrl] = useState(DEFAULT_CLOUD_URL);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const lastBackPress = useRef(0);

  // Native Android Hardware Back Button Handling
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      // 1. If settings modal is open, close it
      if (showSettingsModal) {
        setShowSettingsModal(false);
        return true;
      }

      // 2. If webview has history, navigate back inside webview
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }

      // 3. If at root of app, require double-tap within 2 seconds to exit
      const now = Date.now();
      if (lastBackPress.current && now - lastBackPress.current < 2000) {
        return false; // Exit app
      }
      lastBackPress.current = now;
      ToastAndroid.show('Press back again to exit ParentCare360', ToastAndroid.SHORT);
      return true;
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSubscription.remove();
  }, [canGoBack, showSettingsModal]);

  const handleReload = () => {
    setHasError(false);
    setIsLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleApplyUrl = () => {
    let target = inputUrl.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'http://' + target;
    }
    setCurrentUrl(target);
    setShowSettingsModal(false);
    setHasError(false);
    setIsLoading(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Top Native Control Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandContainer}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>P360</Text>
          </View>
          <Text style={styles.brandText}>ParentCare360</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.controlBtn} onPress={handleReload}>
            <Text style={styles.controlBtnText}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, styles.settingsBtn]}
            onPress={() => setShowSettingsModal(true)}
          >
            <Text style={styles.controlBtnText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main WebView Container */}
      <View style={styles.webViewContainer}>
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          style={styles.webView}
          onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          geolocationEnabled={true}
          allowsBackForwardNavigationGestures={true}
          mediaPlaybackRequiresUserAction={false}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#0d9488" />
              <Text style={styles.loadingText}>Connecting to ParentCare360...</Text>
            </View>
          )}
        />

        {/* Offline / Connection Error Overlay */}
        {hasError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorTitle}>Connection Timeout / Server Offline</Text>
            <Text style={styles.errorDescription}>
              Unable to reach {currentUrl}. If using Render free-tier, the server may take ~30s to wake up.
            </Text>

            <View style={styles.errorButtons}>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleReload}>
                <Text style={styles.primaryBtnText}>Retry Connection</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => setShowSettingsModal(true)}
              >
                <Text style={styles.secondaryBtnText}>Change Server URL</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Server URL Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Backend Server Configuration</Text>
            <Text style={styles.modalSubtitle}>
              Select cloud production or enter your local development machine IP.
            </Text>

            <TextInput
              style={styles.urlInput}
              value={inputUrl}
              onChangeText={setInputUrl}
              placeholder="http://192.168.1.x:5173"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.quickUrls}>
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => setInputUrl(DEFAULT_CLOUD_URL)}
              >
                <Text style={styles.quickChipText}>Cloud Production</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => setInputUrl('http://10.0.2.2:5173')}
              >
                <Text style={styles.quickChipText}>Android Emulator (10.0.2.2)</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowSettingsModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleApplyUrl}>
                <Text style={styles.saveBtnText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  topBar: {
    height: 48,
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)'
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  brandBadge: {
    backgroundColor: '#0d9488',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  brandBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 10
  },
  brandText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  controlBtn: {
    backgroundColor: 'rgba(51, 65, 85, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  settingsBtn: {
    backgroundColor: 'rgba(51, 65, 85, 0.8)'
  },
  controlBtnText: {
    fontSize: 12
  },
  webViewContainer: {
    flex: 1,
    position: 'relative'
  },
  webView: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600'
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  errorEmoji: {
    fontSize: 36,
    marginBottom: 8
  },
  errorTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8
  },
  errorDescription: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20
  },
  errorButtons: {
    flexDirection: 'column',
    gap: 10,
    width: '100%',
    maxWidth: 280
  },
  primaryBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13
  },
  secondaryBtn: {
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  secondaryBtnText: {
    color: '#cbd5e1',
    fontWeight: '600',
    fontSize: 13
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)'
  },
  modalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4
  },
  modalSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 16
  },
  urlInput: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 12
  },
  quickUrls: {
    flexDirection: 'column',
    gap: 6,
    marginBottom: 18
  },
  quickChip: {
    backgroundColor: 'rgba(51, 65, 85, 0.6)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  quickChipText: {
    color: '#5eead4',
    fontSize: 11,
    fontWeight: '600'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 13
  },
  saveBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13
  }
});

