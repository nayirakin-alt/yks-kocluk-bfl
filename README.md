# Rota | YKS 2027 Koçluk

Next.js App Router, Tailwind CSS ve shadcn/ui bileşenleriyle hazırlanmış mobil öncelikli öğrenci/öğretmen koçluk takip sistemi başlangıç projesi.

## Başlangıç

Node.js 20.9 veya üzeri gerekir.

```bash
npm install
npm run dev
```

Uygulama `http://localhost:3000` adresinde açılır. Üretim derlemesi için `npm run build`, lint denetimi için `npm run lint` kullanılır.

## Supabase

Bağlantı değişkenleri `.env.local` dosyasından okunur. Bu dosya Git dışında tutulur; yeni bir ortam için `.env.example` dosyasını temel alabilirsiniz. Tarayıcı ve sunucu tarafı istemcileri `src/lib/supabase/client.ts` ve `src/lib/supabase/server.ts` üzerinden oluşturulur.

Panel, geçerli Supabase Auth oturumunu ve aşağıdaki sütunları kullanır:

- `profiles`: `id` (auth kullanıcısı), `full_name`, `role` (`student` veya `teacher`), `class_code`
- `study_sessions`: `id`, `user_id`, `subject`, `topic`, `duration_minutes`, `question_count`, `created_at`
- `assignments`: `id`, `teacher_id`, `student_id`, `class_code`, `subject`, `topic`, `target_question_count`, `due_date`, `is_completed`

`profiles.id`, `study_sessions.user_id`, `assignments.teacher_id` ve `assignments.student_id` sütunları uygun profil/auth kayıtlarına bağlı olmalıdır. Oturum bulunmadığında kullanıcı `/login` sayfasına yönlendirilir. Bu sayfa e-posta/şifre ile giriş ve kayıt akışlarını sağlar. Kayıt formu rol seçtirmez ve `role` değerini Auth metadata'sına göndermez; doğrudan oluşturulan yeni profil `student` rolüyle kaydedilir. E-posta doğrulaması açıkken profil oluşturan veritabanı trigger'ı da rolü sabit olarak `student` atamalıdır; Auth metadata'sından rol kopyalamamalıdır. Öğretmen rolü yalnızca yetkili yönetici/veritabanı işlemiyle verilmelidir. RLS politikaları kullanıcıların kendi profilindeki `role` alanını değiştirmesine izin vermemelidir. Doğrulamasız kayıt açık ve oturum oluşmuşsa uygulama profil satırını `student` rolüyle doğrudan oluşturur.

Geliştirme ortamında giriş ekranındaki “Demo modunda panelleri incele” seçeneği Supabase'e bağlanmadan öğrenci/öğretmen panelleri arasında geçiş sağlar. Demo değişiklikleri bellekte tutulur, veritabanına yazılmaz ve demo girişi üretim derlemesinde gösterilmez.

Öğretmen sınıfa ödev atadığında, her öğrenci için `student_id` dolu ayrı bir `assignments` satırı oluşturulur. Bu, `is_completed` durumunun öğrenciler arasında paylaşılmasını önler. Öğrencinin “Ödevlerim” alanı kendi atamalarını listeler ve tamamlanma değişikliğini aynı satırdaki `is_completed` alanına yazar. Çalışma seansları da `study_sessions` tablosuna eklenir; öğrenci ve öğretmen metrikleri bu kayıtlardan hesaplanır.

Supabase tarafında Row Level Security (RLS) etkin olmalı ve uygulamanın kullandığı işlemlere izin veren politikalar tanımlanmalıdır: kullanıcı kendi profilini okuyabilmeli; öğretmen kendi sınıfındaki öğrenci profillerini ve seanslarını okuyabilmeli; kullanıcı yalnızca kendi seanslarını ekleyebilmeli; öğretmen kendi adına ödev atayabilmeli/okuyabilmeli; öğrenci yalnızca kendisine atanmış ödevleri okuyup tamamlanma durumunu güncelleyebilmelidir. Yazma politikalarında `auth.uid()` ile `user_id`/`teacher_id` eşleşmesini doğrulayın. Tarayıcıda yalnızca publishable key kullanın; service-role anahtarını istemciye açmayın.

## Yapı

- `src/app`: App Router sayfaları ve global stiller
- `src/components/ui`: shadcn/ui düzeninde tekrar kullanılabilir arayüz bileşenleri
- `src/lib/supabase`: tarayıcı ve cookie tabanlı sunucu istemcileri
- `components.json`: shadcn/ui CLI yapılandırması
