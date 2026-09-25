# ⚡ Extra LLM X — CLI va Ishlatish Qoidalari (CLI & Usage Guide)

Bu qo'llanmada **Extra LLM X** loyihasini terminal orqali **bitta buyruq** (`extra-llm` yoki `extra`) bilan ishlatish qoidalari, sozlashlar va yuzaga kelishi mumkin bo'lgan muammolarni bartaraf etish (Troubleshooting) to'liq tushuntirilgan.

---

## 🚀 1. Bitta Buyruq Bilan Ishga Tushirish

### Bir martalik global faollashtirish (Global Link)
Terminalda loyiha papkasida bir marta quyidagilardan birini bajaring:
```bash
npm link
# yoki
npm install -g .
```

Endi kompyuteringizning **istalgan papkasidan** quyidagi buyruqlar orqali ishlatishingiz mumkin:

```powershell
# Serverni ishga tushirish (Default: port 3000):
extra-llm

# Yoki qisqa variant:
extra
```

---

## 📋 2. Barcha Buyruqlar Ro'yxati (Commands)

| Buyruq | Qisqa varianti | Nima qiladi? |
| :--- | :--- | :--- |
| `extra-llm` | `extra` | Serverni boshlaydi. Agar server allaqachon ishlab turgan bo'lsa, URL va holatini ko'rsatadi. |
| `extra-llm restart` | `extra restart` | **Port band bo'lsa yoki server qotib qolsa**, eski jarayonni o'chirib, toza qayta ishga tushiradi. |
| `extra-llm stop` | `extra stop` | Serverni to'xtatadi va 3000-portni to'liq bo'shatadi. |
| `extra-llm status` | `extra status` | Server holati, faol modellar va portni tekshiradi. |
| `extra-llm open` | `extra open` (yoki `extra ui`) | Brauzerda avtomatik **Web Control Hub** (`http://localhost:3000`) panelini ochadi. |
| `extra-llm key new` | `extra key new "nomi"` | **100% ishlaydigan yangi random API kalit** yaratadi va bazaga saqlaydi (`elx-...`). |
| `extra-llm key list` | `extra key list` | Barcha mavjud API kalitlar va ularning ishlatilish statistikasini jadvalda ko'rsatadi. |
| `extra-llm combos` | `extra combos` | 6 ta virtual routing kombosini (`extra/auto-free`, `extra/frontier`, ...) ko'rsatadi. |
| `extra-llm models` | `extra models` | 80+ provayderlar va ularning modellarini terminalda ro'yxatini chiqaradi. |
| `extra-llm --help` | `extra -h` | CLI yordam menyusini chiqaradi. |

---

## ⚠️ 3. "Menda Ishlamayapti" — Muammolar va Ularning Yechimi (Troubleshooting)

### 🔴 1-Muammo: "Port 3000 is already in use" (3000-port band)
**Sabab:** Orqa fonda oldingi server yoki boshqa dastur 3000-portni band qilib turgan.  
**Yechim:** Shunchaki quyidagi buyruqni bering:
```powershell
extra-llm restart
```
Bu buyruq 3000-portdagi eski jarayonni majburan to'xtatadi va yangi serverni ishga tushiradi.  
Yoki serverni to'xtatish uchun:
```powershell
extra-llm stop
```

---

### 🔴 2-Muammo: PowerShell da "running scripts is disabled on this system"
**Sabab:** Windows PowerShell da skriptlarni bajarish xavfsizlik siyosati (`ExecutionPolicy`) cheklangan bo'lishi mumkin.  
**Yechim A (Tavsiya etiladi):** PowerShell ni ochib, skriptlarga ruxsat bering:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
**Yechim B:** `.cmd` varianti orqali to'g'ridan-to'g'ri chaqiring:
```cmd
extra-llm.cmd
```
yoki CMD (Command Prompt) orqali:
```cmd
extra
```

---

### 🔴 3-Muammo: Server ishlab turganini qanday bilish mumkin?
Terminalda quyidagi buyruqni bering:
```powershell
extra status
```
Agar ishlab turgan bo'lsa:
```text
🟢 Extra LLM X Gateway ONLAYN (Port: 3000)
   - Faol Bepul Modellar: 744+
   - Ulanish nuqtasi: http://localhost:3000/v1
   - Dashboard: http://localhost:3000/
```

---

## ⚡ 3.5. Avtomatik (O'zi) API Kalit Yaratish Qoidalari (Autonomous Keying)

Extra LLM X sizdan ortiqcha harakat talab qilmasdan **o'zi avtomatik API kalit yarata oladi**:

1. **Terminalda bitta so'z bilan:**
   ```powershell
   extra auto
   # yoki
   extra key
   ```
   *Hech qanday nom yoki parametr kiritmasangiz ham, tizim o'zi darhol yangi, 100% ishlaydigan kalit yaratib beradi.*

2. **So'rov paytida avtomatik yaratish (`Bearer auto`):**
   Cursor, Claude Code yoki Python skriptingizda kalit o'rniga `auto` deb yozsangiz kifoya:
   ```python
   client = OpenAI(
       base_url="http://localhost:3000/v1",
       api_key="auto"  # <-- Gateway o'zi avtomatik kalit yaratadi va 200 OK qaytaradi!
   )
   ```
   Gateway ushbu so'rov uchun avtomatik yangi kalit ro'yxatdan o'tkazadi va javob sarlavhasida `X-ExtraLLM-Auto-Key` orqali qaytaradi.

3. **HTTP API orqali avtomatik olish:**
   ```bash
   curl http://localhost:3000/v1/keys/auto
   ```
   Darhol JSON formatida faollashgan kalitni qaytaradi.

4. **Web Hub panelida:**
   Brauzerda ochishingiz bilan yuqori qismda **"Tayyor Faol API Kalit"** vidjeti turadi va **"⚡ O'zi yangi kalit yaratsin"** tugmasi orqali 1 marta bosishda yangi kalit yaratiladi.

---

## 🔑 4. 100% Ishlaydigan API Kalit Yaratish Qoidalari

Extra LLM X tizimida API kalitlar 100% real SQLite bazasida saqlanadi va darhol faollashadi.

### Terminal orqali yaratish:
```powershell
extra-llm key new "Mening-Loyiham"
```
Natija:
```text
  ==============================================================
   🔑 YANGI API KALIT YARATILDI VA DARHOL FAOLLASHTIRILDI (100% ISHLAYDI)
  ==============================================================
   🔑 API Key    : elx-live-a7f4b829c13d8e52
   🏷️  Nom (Label): Mening-Loyiham
   ⚡ RPM Limit  : 120 req/min
   💾 Saqlandi   : SQLite Database (Darhol tayyor)
  ==============================================================
```

### Web Dashboard orqali yaratish:
1. `extra open` buyrug'i orqali brauzerda boshqaruv panelini oching.
2. **"API Keys"** bo'limiga o'ting.
3. **"+ Generate Random Key"** tugmasini bosing.
4. Yangi kalit darhol yaratiladi va "Copy" tugmasi orqali nusxalab olinadi.

---

## 🔌 5. Cursor, Cline, Claude Code va Python bilan Ulanish

### Cursor / VS Code / Claude Code Sozlamalari:
- **Provider Type:** `OpenAI Compatible`
- **Base URL:** `http://localhost:3000/v1`
- **API Key:** `elx-live-master-free-hub` (yoki `extra-llm key new` orqali olingan kalit)
- **Model ID:**
  - `extra/auto-free` (Eng barqaror bepul provayderlar zanjiri)
  - `extra/free-coding` (Dasturlash uchun Qwen 2.5 Coder, DeepSeek V3, Granite)
  - `extra/frontier` (Claude 3.5 Sonnet, GPT-4o, DeepSeek V3/R1)

### Python orqali so'rov yuborish:
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="elx-live-master-free-hub"
)

response = client.chat.completions.create(
    model="extra/auto-free",
    messages=[{"role": "user", "content": "Salom Extra LLM X!"}]
)

print(response.choices[0].message.content)
```

---

## 🧪 6. Testlarni Tekshirish
Loyihaning barcha 88 ta testi to'liq o'tganligini tekshirish uchun:
```bash
npm test
```
Barcha 88 ta test (adapterlar, router, kombolar, sandbox, CLI va API kalitlar) 100% muvaffaqiyatli ishlaydi.
