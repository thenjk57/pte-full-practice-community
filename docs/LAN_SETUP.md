# Local-network practice (free, no cloud)

Run one copy of the app on the host computer. Phones and laptops on the same trusted Wi-Fi/LAN use the host's HTTPS URL; they do not need the project files or database.

## Host computer

From the project directory, run `npm run start:lan`. The launcher detects the private IPv4 address used by the default route, creates a local certificate authority (CA) and an IP-matched HTTPS certificate, then serves only on that address at port 3443. It prints the current URL and the path to the public CA certificate. If the wrong network interface is selected, set `PTE_LAN_HOST` to the host's private IPv4 address before starting. Set `PTE_LAN_PORT` to change the port.

The CA and server keys live in `~/.local/share/pte-full-practice/lan-tls/`, not in the repository. **Never transfer `ca.key` or `server-*.key` to another device.** Only the public `ca.crt` needs to be installed on each client. Keep this folder backed up securely: if the CA is lost and regenerated, every device must trust the new CA.

The host computer must remain on, connected, and running the server. If its Wi-Fi address changes, restart the server and use the new printed URL. The same CA will sign a new IP certificate, so devices should not need to repeat the trust step. Reserving the host's IP in the router avoids URL changes.

On Linux, you can configure a user service to keep the app running. Check your service configuration and login requirements before relying on it.

## One-time trust on each device

Transfer **only** the public `ca.crt` to each device (for example, with AirDrop, a USB cable, or another transfer method you trust). This is a certificate, not a copy of the app. The certificate name is **PTE Local Practice CA**. Compare its fingerprint with the host before installing:

```bash
openssl x509 -in ~/.local/share/pte-full-practice/lan-tls/ca.crt -noout -fingerprint -sha256
```

- **iPhone/iPad:** Open the certificate file and install its downloaded profile in Settings. Then go to **Settings → General → About → Certificate Trust Settings** and enable full trust for **PTE Local Practice CA**. Return to Safari and open the HTTPS URL.
- **Android:** In Settings, find **Install a certificate → CA certificate** (often under Security & privacy → More security settings → Encryption & credentials). Select `ca.crt`, accept Android's trust warning, then open the HTTPS URL in Chrome. Menu wording varies by Android version.
- **Windows:** Import `ca.crt` into the **Current User → Trusted Root Certification Authorities** store with Certificate Manager, then restart the browser.
- **macOS:** Import `ca.crt` into Keychain Access and mark it **Always Trust**, then restart the browser.
- **Linux:** Trust `ca.crt` in the operating-system certificate store and, for Chromium-based browsers, the user's NSS certificate store. Restart the entire browser application after importing the certificate; reloading a tab alone may retain the old trust result. Firefox may use its own certificate store.

After trust is installed, the browser should show a secure HTTPS connection. Allow microphone access when prompted and run the app's equipment check. Do not bypass certificate warnings: a warning means the device has not trusted the CA, the URL/IP changed, or the certificate is wrong.

## Network and privacy limits

- All devices must be on the same LAN. Guest Wi-Fi/client isolation can block access even when the host works locally.
- `ERR_CERT_AUTHORITY_INVALID` means the browser reached the server but does not trust the local CA. Install the public `ca.crt` on that device and fully restart its browser. A Fly.io login does not install or authorize the LAN certificate.
- The LAN listener redirects plain HTTP on its HTTPS port to the matching HTTPS address, so entering only the IP and port works. The app itself is served only over HTTPS. Older running versions instead return `ERR_EMPTY_RESPONSE` or "did not send any data" for those HTTP requests; restart `pte-practice-lan.service` after updating.
- If the page cannot be reached from another device, check that the host is running, the printed IP is current, and the host firewall allows TCP port 3443 from the local subnet. Do not open or forward this port on the internet router.
- HTTPS encrypts traffic but this app currently has no per-user login. **Anyone who can reach this LAN port can use the app and view its shared attempts/recordings.** Use only a trusted network. Different devices share completed results; in-progress exams do not transfer between devices.
- This setup proves the host serves the site and API. Microphone permission, recording, and playback still need an actual check on each target browser/device after certificate trust is installed.
