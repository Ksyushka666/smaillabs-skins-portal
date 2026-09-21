package ru.smaillabs.skins;

public final class ProfileData {
    public String profileName = "default";
    public String skinPath = "";
    public String capePath = "";
    public String skinUrl = "";
    public String capeUrl = "";
    public String model = "classic";

    public ProfileData copy() {
        ProfileData copy = new ProfileData();
        copy.profileName = profileName;
        copy.skinPath = skinPath;
        copy.capePath = capePath;
        copy.skinUrl = skinUrl;
        copy.capeUrl = capeUrl;
        copy.model = model;
        return copy;
    }
}
