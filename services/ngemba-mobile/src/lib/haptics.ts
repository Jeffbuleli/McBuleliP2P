import * as Haptics from "expo-haptics";

export async function hapticSosConfirm() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // device may not support haptics
  }
}

export async function hapticDiscreteConfirm() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((r) => setTimeout(r, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((r) => setTimeout(r, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // ignore
  }
}

export async function hapticTap() {
  try {
    await Haptics.selectionAsync();
  } catch {
    // ignore
  }
}
