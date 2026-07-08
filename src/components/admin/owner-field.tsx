import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { UserPickerModal } from '@/components/admin/user-picker-modal';
import { Avatar } from '@/components/ui/avatar';
import { BusinessOwner } from '@/services/admin-businesses';

type Props = {
  owner: BusinessOwner | null;
  onChange: (owner: BusinessOwner | null) => void;
};

/**
 * Dueño/representante legal del negocio: tarjeta del usuario vinculado (con
 * X para desvincular) o buscador para elegir uno existente.
 */
export function OwnerField({ owner, onChange }: Props) {
  const [pickerVisible, setPickerVisible] = useState(false);

  return (
    <>
      <Text className="mb-2 text-sm font-bold text-gray-700">
        Dueño / representante legal
      </Text>
      {owner ? (
        <View className="mb-4 flex-row items-center gap-3 rounded-xl border border-gray-200 px-3.5 py-3">
          <Avatar label={owner.fullName} size={40} />
          <View className="flex-1">
            <Text numberOfLines={1} className="text-[15px] font-bold text-dark">
              {owner.fullName}
            </Text>
            <Text numberOfLines={1} className="text-xs text-muted">
              {[
                owner.identificationNumber && `ID ${owner.identificationNumber}`,
                owner.email,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
          <Pressable onPress={() => onChange(null)} hitSlop={8}>
            <Ionicons name="close-circle" size={22} color="#9CA3AF" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setPickerVisible(true)}
          className="mb-4 h-[52px] flex-row items-center gap-2.5 rounded-xl border border-gray-200 px-3.5 active:opacity-70"
        >
          <Ionicons name="person-outline" size={20} color="#9CA3AF" />
          <Text className="flex-1 text-[15px] text-gray-400">
            Buscar usuario para vincular…
          </Text>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
        </Pressable>
      )}

      <UserPickerModal
        visible={pickerVisible}
        title="Buscar representante"
        onClose={() => setPickerVisible(false)}
        onSelect={(u) => {
          onChange({
            id: u.id,
            fullName: u.fullName,
            email: u.email,
            phone: u.phone,
            identificationNumber: u.identificationNumber,
          });
          setPickerVisible(false);
        }}
      />
    </>
  );
}
