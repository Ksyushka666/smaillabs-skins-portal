package ru.smaillabs.skins;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import net.fabricmc.loader.api.FabricLoader;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public final class ProfileStore {
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private static final Path ROOT = FabricLoader.getInstance().getConfigDir().resolve("smaillabs");
    private static final Path PROFILE_FILE = ROOT.resolve("profile.json");
    private static final Path ASSET_DIR = ROOT.resolve("assets");

    private ProfileStore() {}

    public static ProfileData load() {
        try {
            if (!Files.exists(PROFILE_FILE)) return new ProfileData();
            ProfileData data = GSON.fromJson(Files.readString(PROFILE_FILE), ProfileData.class);
            return data == null ? new ProfileData() : data;
        } catch (Exception ignored) {
            return new ProfileData();
        }
    }

    public static void save(ProfileData data) throws IOException {
        Files.createDirectories(ROOT);
        Files.writeString(PROFILE_FILE, GSON.toJson(data));
    }

    public static Path assetsDirectory() throws IOException {
        Files.createDirectories(ASSET_DIR);
        return ASSET_DIR;
    }
}
