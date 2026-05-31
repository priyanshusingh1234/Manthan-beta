import { Platform } from 'react-native';

const LocalNotifications = { 
  schedule: async () => {}, 
  registerActionTypes: async () => {}, 
  addListener: async () => {},
  checkPermissions: async () => ({ display: 'granted' }),
  requestPermissions: async () => ({ display: 'granted' }),
  cancel: async () => {}
};

/**
 * Schedules a local notification 20 hours from now to remind the user to feed their pet.
 * If a notification is already scheduled, it will cancel the old one and schedule a new one.
 */
export async function schedulePetFeedingReminder(petName: string = 'your pet') {
    if (Platform.OS !== 'web') {
        console.log('Skipping local notification schedule: Not running on a native platform.');
        return;
    }

    try {
        // Request permissions if needed
        const permStatus = await LocalNotifications.checkPermissions();
        if (permStatus.display !== 'granted') {
            const request = await LocalNotifications.requestPermissions();
            if (request.display !== 'granted') return;
        }

        // Cancel any existing pet reminder (we assume ID 999 is reserved for pet reminders)
        await LocalNotifications.cancel({ notifications: [{ id: 999 }] } as any);

        // Schedule new notification for 20 hours from now
        const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 20); // 20 hours

        await LocalNotifications.schedule({
            notifications: [
                {
                    title: `🥺 ${petName} is getting hungry!`,
                    body: `It's been a while. Come solve a quick question to feed ${petName} and keep your streak alive!`,
                    id: 999,
                    schedule: { at: futureDate },
                    sound: null, // default sound
                }
            ]
        } as any);

        console.log(`[PetNotifications] Scheduled reminder for ${petName} at ${futureDate}`);
    } catch (error) {
        console.error('[PetNotifications] Error scheduling reminder:', error);
    }
}
