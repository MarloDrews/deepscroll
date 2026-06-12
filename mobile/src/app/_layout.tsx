import "../../global.css"

import { useEffect, useState } from "react"
import { View } from "react-native"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import * as SplashScreen from "expo-splash-screen"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { useFonts } from "expo-font"
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
} from "@expo-google-fonts/newsreader"
import {
  SourceSans3_400Regular,
  SourceSans3_500Medium,
  SourceSans3_600SemiBold,
} from "@expo-google-fonts/source-sans-3"
import { GeistMono_400Regular } from "@expo-google-fonts/geist-mono"
import { initAuthToken } from "../lib/api"
import { AuthProvider } from "../lib/auth"
import { colors } from "../theme/tokens"

// Keep the native splash visible until fonts and the auth token cache are
// ready, so the first painted frame is already styled and authenticated.
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_500Medium,
    SourceSans3_400Regular,
    SourceSans3_500Medium,
    SourceSans3_600SemiBold,
    GeistMono_400Regular,
  })
  const [tokenReady, setTokenReady] = useState(false)

  useEffect(() => {
    // Fills the module-level token cache from SecureStore once, so apiFetch
    // can read it synchronously afterwards (see src/lib/api.ts).
    initAuthToken().finally(() => setTokenReady(true))
  }, [])

  const ready = fontsLoaded && tokenReady

  useEffect(() => {
    if (ready) SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: colors["surface-0"] }}>
        <StatusBar style="light" />
        {/* AuthProvider mounts after initAuthToken resolved (layout returns
            null until then), so it can read the cached token synchronously. */}
        <AuthProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors["surface-0"] },
            }}
          />
        </AuthProvider>
      </View>
    </GestureHandlerRootView>
  )
}
