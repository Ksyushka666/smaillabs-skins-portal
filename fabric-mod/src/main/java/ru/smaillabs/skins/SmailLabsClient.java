package ru.smaillabs.skins;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper;
import net.minecraft.client.option.KeyBinding;
import net.minecraft.client.util.InputUtil;
import org.lwjgl.glfw.GLFW;

public final class SmailLabsClient implements ClientModInitializer {
    private static KeyBinding profileKey;

    @Override
    public void onInitializeClient() {
        profileKey = KeyBindingHelper.registerKeyBinding(new KeyBinding(
            "key.smaillabs.open_profile",
            InputUtil.Type.KEYSYM,
            GLFW.GLFW_KEY_P,
            "category.smaillabs"
        ));

        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            while (profileKey.wasPressed()) {
                if (client.currentScreen == null) client.setScreen(new ProfileScreen(null));
            }
        });
    }
}
