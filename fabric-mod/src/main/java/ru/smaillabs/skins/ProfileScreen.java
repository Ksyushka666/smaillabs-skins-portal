package ru.smaillabs.skins;

import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.widget.ButtonWidget;
import net.minecraft.client.gui.widget.TextFieldWidget;
import net.minecraft.text.Text;

import java.awt.FileDialog;
import java.awt.Frame;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

public final class ProfileScreen extends Screen {
    private final Screen parent;
    private final ProfileData profile;
    private TextFieldWidget profileName;
    private TextFieldWidget skinUrl;
    private TextFieldWidget capeUrl;
    private TextFieldWidget model;
    private String status = "Выберите PNG-файл или вставьте HTTPS-ссылку";

    public ProfileScreen(Screen parent) {
        super(Text.literal("SmailLabs Skin Profile"));
        this.parent = parent;
        this.profile = ProfileStore.load();
    }

    @Override
    protected void init() {
        int center = width / 2;
        int left = center - 155;
        profileName = addDrawableChild(new TextFieldWidget(textRenderer, left, 55, 310, 20, Text.literal("Имя профиля")));
        profileName.setText(profile.profileName);
        skinUrl = addDrawableChild(new TextFieldWidget(textRenderer, left, 105, 220, 20, Text.literal("HTTPS URL скина")));
        skinUrl.setText(profile.skinUrl);
        capeUrl = addDrawableChild(new TextFieldWidget(textRenderer, left, 170, 220, 20, Text.literal("HTTPS URL плаща")));
        capeUrl.setText(profile.capeUrl);
        model = addDrawableChild(new TextFieldWidget(textRenderer, left, 235, 310, 20, Text.literal("classic или slim")));
        model.setText(profile.model);

        addDrawableChild(ButtonWidget.builder(Text.literal("Выбрать PNG скина"), button -> chooseFile(true)).dimensions(left + 225, 105, 85, 20).build());
        addDrawableChild(ButtonWidget.builder(Text.literal("Выбрать PNG плаща"), button -> chooseFile(false)).dimensions(left + 225, 170, 85, 20).build());
        addDrawableChild(ButtonWidget.builder(Text.literal("Загрузить скин по URL"), button -> downloadUrl(true)).dimensions(left, 130, 150, 20).build());
        addDrawableChild(ButtonWidget.builder(Text.literal("Загрузить плащ по URL"), button -> downloadUrl(false)).dimensions(left + 160, 195, 150, 20).build());
        addDrawableChild(ButtonWidget.builder(Text.literal("Сохранить профиль"), button -> saveProfile()).dimensions(center - 155, height - 45, 150, 20).build());
        addDrawableChild(ButtonWidget.builder(Text.literal("Назад"), button -> close()).dimensions(center + 5, height - 45, 150, 20).build());
    }

    private void chooseFile(boolean skin) {
        FileDialog dialog = new FileDialog((Frame) null, skin ? "Выберите PNG-скин" : "Выберите PNG-плащ", FileDialog.LOAD);
        dialog.setFile("*.png");
        dialog.setVisible(true);
        if (dialog.getFile() == null || dialog.getDirectory() == null) return;
        Path selected = Path.of(dialog.getDirectory(), dialog.getFile());
        try {
            if (!Files.isRegularFile(selected) || !selected.getFileName().toString().toLowerCase().endsWith(".png")) throw new IOException("Нужен PNG-файл");
            Path target = ProfileStore.assetsDirectory().resolve(skin ? "skin.png" : "cape.png");
            Files.copy(selected, target, StandardCopyOption.REPLACE_EXISTING);
            if (skin) {
                profile.skinPath = target.toString();
                skinUrl.setText("");
            } else {
                profile.capePath = target.toString();
                capeUrl.setText("");
            }
            status = (skin ? "Скин" : "Плащ") + " сохранён локально: " + target.getFileName();
        } catch (IOException error) {
            status = "Ошибка файла: " + error.getMessage();
        }
    }

    private void downloadUrl(boolean skin) {
        String rawUrl = (skin ? skinUrl : capeUrl).getText().trim();
        if (rawUrl.isBlank()) {
            status = "Введите HTTPS-ссылку";
            return;
        }
        status = "Загрузка...";
        Thread.startVirtualThread(() -> {
            try {
                Path target = ProfileStore.assetsDirectory().resolve(skin ? "skin-url.png" : "cape-url.png");
                AssetDownloader.downloadPng(rawUrl, target);
                if (skin) profile.skinPath = target.toString(); else profile.capePath = target.toString();
                MinecraftClient.getInstance().execute(() -> status = (skin ? "Скин" : "Плащ") + " загружен по HTTPS-ссылке");
            } catch (Exception error) {
                MinecraftClient.getInstance().execute(() -> status = "Ошибка URL: " + error.getMessage());
            }
        });
    }

    private void saveProfile() {
        profile.profileName = profileName.getText().isBlank() ? "default" : profileName.getText().trim();
        profile.skinUrl = skinUrl.getText().trim();
        profile.capeUrl = capeUrl.getText().trim();
        profile.model = model.getText().equalsIgnoreCase("slim") ? "slim" : "classic";
        try {
            ProfileStore.save(profile);
            status = "Профиль сохранён в config/smaillabs/profile.json";
        } catch (IOException error) {
            status = "Ошибка сохранения: " + error.getMessage();
        }
    }

    @Override
    public void close() {
        client.setScreen(parent);
    }

    @Override
    public void render(DrawContext context, int mouseX, int mouseY, float delta) {
        renderBackground(context, mouseX, mouseY, delta);
        int center = width / 2;
        context.drawCenteredTextWithShadow(textRenderer, title, center, 25, 0xFFFFFF);
        context.drawTextWithShadow(textRenderer, Text.literal("Имя профиля"), center - 155, 42, 0xAFC5D9);
        context.drawTextWithShadow(textRenderer, Text.literal("Скин: файл или HTTPS URL"), center - 155, 92, 0xAFC5D9);
        context.drawTextWithShadow(textRenderer, Text.literal("Плащ: файл или HTTPS URL"), center - 155, 157, 0xAFC5D9);
        context.drawTextWithShadow(textRenderer, Text.literal("Модель: classic / slim"), center - 155, 222, 0xAFC5D9);
        context.drawCenteredTextWithShadow(textRenderer, Text.literal(status), center, height - 70, 0x8BD8FF);
        super.render(context, mouseX, mouseY, delta);
    }
}
