# 🚀 Project Manager (Plurals)

> **Project Manager**, ekiplerin proje, görev, çalışma alanı ve ekip içi iletişim süreçlerini tek bir çatı altından kusursuzca yönetebilmesi için geliştirilmiş, kurumsal seviyede bir **Full-Stack Web Uygulamasıdır.** 🏢✨

Bu proje; görev takibi, proje yönetimi, çalışma alanı (workspace) izolasyonu, aktivite geçmişi, anlık bildirimler, gelişmiş analitik ekranları ve dışa aktarma (export) özelliklerini modern bir arayüzde birleştirir.

---

## ✨ Öne Çıkan Özellikler

* 🔒 **Güvenli Erişim:** Kullanıcı kayıt olma ve JWT tabanlı giriş yapma.
* 🏢 **Workspace (Çalışma Alanı):** Çoklu workspace oluşturma, değiştirme, güncelleme ve silme.
* 📁 **Proje Yönetimi:** Proje oluşturma, düzenleme, silme ve dinamik aktif proje seçimi.
* 📋 **Dinamik Kanban Board:** Görevleri kolonlar arasında sürükle-bırak (Drag & Drop) ile ilerletme.
* 🎯 **Görev Takibi:** Görev durumu, öncelik (Priority) ve teslim tarihi (Due Date) yönetimi.
* 👥 **Takım Çalışması:** Proje üyelerini ekleme, çıkarma ve yetkilendirme.
* 📢 **İletişim:** Ekip içi Broadcast (duyuru) ve bildirim gönderme.
* 📜 **Denetim İzi (Audit Log):** Kapsamlı aktivite akışı ve işlem geçmişi görüntüleme.
* 📊 **Gelişmiş Analitik:** Görev ve saat bazlı haftalık özetler, interaktif grafikler.
* 📥 **Dışa Aktarma (Export):** Görevleri ve analitik verileri **CSV** veya **PDF** olarak indirme.
* 🎨 **Kişiselleştirme:** Kullanıcı profili güncelleme, avatar yükleme ve tema/hesap ayarları yönetimi.

---

## 🛠️ Kullanılan Teknolojiler

Uygulama, en güncel web teknolojileri kullanılarak yüksek performans ve ölçeklenebilirlik hedefiyle inşa edilmiştir.

### 💻 Frontend
* **Framework:** ⚛️ Next.js 16 & React 19
* **Dil:** 📘 TypeScript
* **Stil & UI:** 🎨 Tailwind CSS 4, Lucide React
* **Veri Çekimi:** ⚡ Axios
* **Grafikler:** 📈 Recharts

### ⚙️ Backend
* **Framework:** 🚀 FastAPI
* **Veritabanı & ORM:** 🗄️ SQLite & SQLAlchemy
* **Veri Doğrulama:** 🛡️ Pydantic
* **Güvenlik:** 🔑 JWT (JSON Web Token) & bcrypt
* **PDF Üretimi:** 📄 ReportLab

---

## 🧭 Sayfalar ve İşlevleri

* 🚪 **Giriş / Kayıt:** Kullanıcı girişi ve yeni hesap oluşturma. (Demo kullanıcı ile hızlı erişim imkanı).
* 🏠 **Dashboard:** Seçili projenin genel özeti, ekip üyeleri, görev aktivite grafikleri, broadcast alanı ve tamamlanan/planlanan görevler.
* 📁 **Project:** Proje oluşturma, yeniden adlandırma, silme ve proje bazlı istatistikler.
* 📋 **Tasks:** Sürükle-bırak destekli Kanban board, görev yönetimi ve CSV/PDF dışa aktarma.
* 📅 **Schedule:** Görev teslim tarihlerini takvim görünümünde izleme ve yaklaşan görevleri listeleme.
* ⏱️ **Activity:** Proje bazlı veya global aktivite geçmişi, işlem türüne göre filtreleme.
* 📈 **Analytics:** Haftalık görev üretim/tamamlanma oranları, saat dağılımları ve CSV export.
* ⚙️ **Settings:** Profil güncelleme, avatar yükleme, workspace ayarları, şifre ve tema yönetimi.
* 🛟 **Support:** SSS (Sık Sorulan Sorular) ve destek mesajı gönderme alanı.

---

## 🔌 API Yapısı (Backend Routes)

Backend mimarimiz modüler olarak aşağıdaki ana route gruplarına ayrılmıştır:

* 🔑 `/auth` - Giriş, kayıt, kullanıcı bilgisi ve şifre yönetimi
* 🏢 `/workspace` - Çalışma alanı CRUD işlemleri
* 📁 `/project` - Proje işlemleri
* ✅ `/task` - Görev işlemleri ve detayları
* 👤 `/user` - Kullanıcı profili, avatar ve üye yönetimi
* 🔔 `/notification` - Bildirim ve broadcast işlemleri
* 📜 `/activity` & `/activity-log` - Aktivite ve geçmiş verileri
* 📊 `/dashboard` - Özet ve analitik veriler
* 🚀 `/launch` - Planlanan launch (lansman) kayıtları
* 📥 `/export` - CSV ve PDF üretimi
* 🔍 `/search` - Global arama işlemleri

---

## 📂 Proje Yapısı

```text
project-manager/
├─ backend/
│  ├─ app/
│  ├─ static/
│  ├─ requirements.txt
│  ├─ .env.example
│  └─ main.py
├─ frontend/
│  ├─ app/
│  ├─ components/
│  ├─ context/
│  ├─ api/
│  ├─ .env.example
│  └─ package.json
└─ README.md
```

---

## 🚀 Kurulum & Çalıştırma
Projeyi lokalinizde çalıştırmak için aşağıdaki adımları izleyin.

### 🐍 Backend (FastAPI)
```bash
cd backend
python -m venv venv

# Windows için
.\venv\Scripts\activate
# Mac/Linux için: source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```
💡 Backend varsayılan olarak http://127.0.0.1:8000 adresinde çalışacaktır.

### 🌐 Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Ortam Değişkenleri (.env)
### Backend
backend/.env.example dosyasını backend/.env olarak kopyalayın:
```bash
DATABASE_URL=sqlite:///./app.db
SECRET_KEY=change-me
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=5
```

### Frontend
frontend/.env.example dosyasını frontend/.env.local olarak kopyalayın:
```bash
NEXT_PUBLIC_API_URL=[http://127.0.0.1:8000](http://127.0.0.1:8000)
```

---

## 🎭 Demo Kullanıcı
Sistemi hızlıca test etmek için aşağıdaki demo bilgilerini kullanabilirsiniz:

* 📧 E-posta: ar.shakir@plurals.com
* 🔑 Şifre: demo123

## 📌 Notlar
* 🗄️ Backend tarafında geliştirme kolaylığı için SQLite kullanılmaktadır.

* 🌱 Uygulama ilk açılışta veritabanını otomatik oluşturur ve örnek verileri (seed) üretir.

* 🖼️ Avatar ve dosya yüklemeleri lokal olarak backend/static/avatars dizininde tutulmaktadır.

---

## 🎯 Geliştirme Amacı
Bu proje, modern bir proje yönetim ürününün temel yapı taşlarını uçtan uca göstermek için tasarlanmıştır. Temel amaç; sadece basit bir görev listesi sunan bir arayüz değil, ekiplerin günlük operasyonlarını yönetebileceği, izole edilmiş ve bütünleşik bir çalışma alanı (Workspace) mimarisi oluşturmaktır.

---

### 📫 İletişim & Bağlantılar

Projeyle ilgili geri bildirimleriniz, işbirlikleri veya sadece kahve eşliğinde yazılım konuşmak için bana her zaman ulaşabilirsiniz! ☕

* 💼 **LinkedIn:** [halilbsp](https://www.linkedin.com/in/halil-ba%C5%9Fp%C4%B1nar-0a7478384/)
* ✉️ **Email:** [baspinar.halil.4343@gmail.com](baspinar.halil.4343@gmail.com)
