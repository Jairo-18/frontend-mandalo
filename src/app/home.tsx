import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddressSheet } from '@/components/client/address-sheet';
import { getSession } from '@/lib/session';
import { signOutEverywhere } from '@/lib/sign-out';
import { UserAddress, userAddressesService } from '@/services/user-addresses';

/**
 * Home del cliente (rol USER): navbar con el selector "Enviar a…" (la
 * dirección principal) que abre la hoja de direcciones. El explorar de
 * negocios/productos llega con los endpoints públicos (backlog).
 */
export default function HomeScreen() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [sheetVisible, setSheetVisible] = useState(false);

  const user = getSession()?.user;
  const defaultAddress = addresses.find((a) => a.isDefault);

  useEffect(() => {
    let alive = true;
    userAddressesService
      .list()
      .then((res) => {
        if (alive) setAddresses(res.data);
      })
      .catch(() => {
        // El interceptor HTTP ya mostró el error; el chip queda en "Elegir".
      })
      .finally(() => {
        if (alive) setLoadingAddress(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function handleLogout() {
    setSigningOut(true);
    await signOutEverywhere();
    setSigningOut(false);
    router.replace('/auth/login');
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Navbar: selector de dirección + cerrar sesión */}
      <View className="flex-row items-center gap-3 px-5 pb-3 pt-2">
        <Pressable
          onPress={() => setSheetVisible(true)}
          className="flex-1 flex-row items-center gap-2 rounded-full bg-surface px-3.5 py-2.5 active:opacity-70"
        >
          <Ionicons name="location" size={18} color="#FF5A3C" />
          <View className="flex-1">
            <Text className="text-[10px] font-bold uppercase tracking-wide text-muted">
              Enviar a
            </Text>
            {loadingAddress ? (
              <ActivityIndicator
                size="small"
                color="#FF5A3C"
                style={{ alignSelf: 'flex-start' }}
              />
            ) : (
              <Text numberOfLines={1} className="text-[13px] font-bold text-dark">
                {defaultAddress
                  ? `${defaultAddress.label} — ${defaultAddress.address}`
                  : 'Elegir dirección'}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-down" size={16} color="#7A7A8A" />
        </Pressable>

        <Pressable
          onPress={handleLogout}
          disabled={signingOut}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full bg-surface active:opacity-70"
        >
          {signingOut ? (
            <ActivityIndicator size="small" color="#FF5A3C" />
          ) : (
            <Ionicons name="log-out-outline" size={20} color="#FF5A3C" />
          )}
        </Pressable>
      </View>

      {/* Contenido: explorar negocios/productos llega con el módulo público */}
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-primary-tint">
          <Ionicons name="storefront-outline" size={40} color="#FF5A3C" />
        </View>
        <Text className="text-center text-2xl font-extrabold text-dark">
          ¡Hola{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}!
        </Text>
        <Text className="mt-2 text-center text-sm text-muted">
          Muy pronto vas a poder explorar los negocios de tu zona y pedir lo
          que quieras. LO PIDES, LO LLEVAMOS.
        </Text>
      </View>

      <AddressSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onChanged={setAddresses}
      />
    </SafeAreaView>
  );
}
