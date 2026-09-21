package ru.smaillabs.skins;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;

public final class AssetDownloader {
    private static final long MAX_BYTES = 5L * 1024L * 1024L;
    private static final byte[] PNG_SIGNATURE = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
    private static final HttpClient CLIENT = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();

    private AssetDownloader() {}

    public static Path downloadPng(String rawUrl, Path target) throws IOException, InterruptedException {
        URI uri = URI.create(rawUrl.trim());
        if (!"https".equalsIgnoreCase(uri.getScheme())) throw new IOException("Требуется HTTPS-ссылка");
        HttpRequest request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(30)).header("Accept", "image/png").GET().build();
        HttpResponse<byte[]> response = CLIENT.send(request, HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() < 200 || response.statusCode() >= 300) throw new IOException("Сервер вернул HTTP " + response.statusCode());
        byte[] bytes = response.body();
        if (bytes.length == 0 || bytes.length > MAX_BYTES || !isPng(bytes)) throw new IOException("Файл не является допустимым PNG до 5 МБ");
        Files.createDirectories(target.getParent());
        Files.write(target, bytes);
        return target;
    }

    public static boolean isPng(byte[] bytes) {
        if (bytes.length < PNG_SIGNATURE.length) return false;
        for (int i = 0; i < PNG_SIGNATURE.length; i++) if (bytes[i] != PNG_SIGNATURE[i]) return false;
        return true;
    }
}
