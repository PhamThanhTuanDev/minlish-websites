import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Brain, BarChart3, Layers, Zap, Target, Github, Twitter, Mail, Repeat2, CheckCircle2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: Layers, title: 'Flashcard thông minh', desc: 'Lật thẻ với animation mượt mà, học từ vựng trực quan' },
  { icon: Brain, title: 'Spaced Repetition', desc: 'Thuật toán SM-2 giúp nhớ lâu hơn với lịch ôn tập tối ưu' },
  { icon: Target, title: 'Collocation & Context', desc: 'Học từ qua ví dụ thực tế, cụm từ đi kèm' },
  { icon: BarChart3, title: 'Theo dõi tiến độ', desc: 'Dashboard chi tiết về streak, accuracy và retention' },
  { icon: Zap, title: 'Học mỗi ngày', desc: 'Kế hoạch học tập hàng ngày với từ mới và từ cần ôn' },
  { icon: BookOpen, title: 'Tạo bộ từ riêng', desc: 'Tùy chỉnh bộ từ theo mục tiêu: IELTS, TOEIC, Business' },
];

const highlights = [
  { label: 'Người học tích cực', value: '20K+' },
  { label: 'Từ được ôn mỗi ngày', value: '120K' },
  { label: 'Tỉ lệ ghi nhớ tốt hơn', value: '92%' },
];

const socialProof = ['5.000+ review tích cực', 'Lộ trình cá nhân hóa', 'Phù hợp người bận rộn', 'Bắt đầu miễn phí'];

const learningSteps = [
  {
    icon: BookOpen,
    title: 'Chọn bộ từ phù hợp mục tiêu',
    desc: 'Bắt đầu từ các bộ IELTS, TOEIC, giao tiếp hằng ngày hoặc tự tạo bộ cá nhân của riêng bạn.',
  },
  {
    icon: Repeat2,
    title: 'Học và ôn lại đúng thời điểm',
    desc: 'Hệ thống SM-2 tự động sắp lịch ôn theo mức độ nhớ, giúp bạn học ít nhưng nhớ sâu.',
  },
  {
    icon: Trophy,
    title: 'Theo dõi tiến bộ mỗi ngày',
    desc: 'Xem streak, độ chính xác và mức độ ghi nhớ để điều chỉnh nhịp học thông minh hơn.',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-16 pt-20 md:pb-20 md:pt-28">
        <div className="absolute inset-0 bg-gradient-hero opacity-5" />
        <div className="absolute inset-0 hero-mesh" />
        <div className="absolute -top-24 left-10 h-48 w-48 hero-orb hero-orb-left md:h-72 md:w-72" />
        <div className="absolute bottom-10 right-6 h-40 w-40 hero-orb hero-orb-right md:h-64 md:w-64" />
        <div className="container relative mx-auto grid items-center gap-14 text-center md:grid-cols-[1.1fr_0.9fr] md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary shadow-sm">
              <Zap className="h-4 w-4" />
              Phương pháp Spaced Repetition
            </div>
            <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-[4.25rem] lg:leading-[1.04]">
              Học từ vựng
              <br />
              <span className="text-gradient-primary">thông minh hơn</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground md:mx-0 md:text-xl">
              MinLish giúp bạn ghi nhớ từ vựng tiếng Anh hiệu quả với flashcard,
              spaced repetition và học qua ngữ cảnh thực tế.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 md:justify-start">
              {['IELTS', 'TOEIC', 'Giao tiếp', 'Business English'].map((tag) => (
                <span key={tag} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row md:justify-start">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button asChild size="lg" className="bg-gradient-primary px-8 text-base font-semibold shadow-elevated hover:opacity-90 md:text-lg">
                  <Link to="/sets">Bắt đầu học ngay</Link>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button asChild variant="outline" size="lg" className="border-accent/40 bg-accent/20 px-8 text-base font-semibold text-amber-800 hover:text-primary-foreground md:text-lg">
                  <Link to="/dashboard">Xem tiến độ</Link>
                </Button>
              </motion.div>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              {highlights.map(({ label, value }, index) => (
                <motion.div
                  key={label}
                  className="rounded-2xl border border-border/70 bg-card/80 p-4 text-left shadow-card backdrop-blur"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.5, ease: "easeOut" }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
                >
                  <p className="font-heading text-2xl font-bold text-foreground">{value}</p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">{label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Floating cards */}
          <motion.div
            className="relative mx-auto w-full max-w-md md:max-w-lg"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
          >
            <motion.div
              className="relative rounded-2xl border border-border bg-card p-8 shadow-elevated hover-lift card-glow"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-sm font-medium text-muted-foreground">/juːˈbɪk.wɪ.təs/</p>
                  <h3 className="font-heading text-3xl font-bold text-foreground">Ubiquitous</h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-6 rounded-xl bg-secondary/70 p-4 text-left">
                <p className="text-base font-semibold text-foreground">Có mặt ở khắp nơi</p>
                <p className="mt-1 text-sm italic text-muted-foreground">
                  "Mobile phones are ubiquitous in modern society."
                </p>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-2 text-left text-sm font-medium text-muted-foreground">
                <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1">Ngữ cảnh</span>
                <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1">Ôn hằng ngày</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 pb-10 md:pb-12">
        <div className="container mx-auto">
          <motion.div
            className="grid gap-3 rounded-2xl border border-border/80 bg-card/65 p-4 shadow-card backdrop-blur md:grid-cols-4 md:gap-4 md:p-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
          >
            {socialProof.map((proof, index) => (
              <motion.div
                key={proof}
                className="rounded-xl border border-border/70 bg-background/90 px-4 py-3 text-sm font-semibold text-foreground/85 transition-all duration-300 hover:bg-primary/5 hover:border-primary/30"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                {proof}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="relative overflow-hidden border-y border-border bg-gradient-to-b from-card/70 via-cyan-50/25 to-card/70 px-4 py-12 backdrop-blur-sm md:py-14">
        <div className="pointer-events-none absolute -left-16 top-8 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-10 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="container mx-auto">
          <div className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Tính năng nổi bật
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
              Mọi thứ bạn cần để chinh phục từ vựng tiếng Anh
            </p>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-7">
            <motion.div
              className="feature-hero-panel rounded-3xl p-6 md:p-8"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, amount: 0.25 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/24 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/95">
                <Brain className="h-4 w-4" />
                Cốt lõi học tập
              </div>

              <h3 className="mt-5 font-heading text-2xl font-bold tracking-tight text-white/95 md:text-3xl">
                Spaced repetition + ngữ cảnh thực tế
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85 md:text-base">
                Không chỉ học nghĩa, bạn học cả cách dùng từ trong câu thật. Hệ thống tự điều chỉnh nhịp ôn theo mức độ nhớ của từng từ.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {features.slice(0, 4).map(({ icon: Icon, title }) => (
                  <div key={title} className="rounded-xl border border-white/35 bg-white/18 px-4 py-3 text-white/95 backdrop-blur">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-semibold">{title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1"
              variants={container}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
            >
              {features.slice(4).map(({ icon: Icon, title, desc }) => (
                <motion.div
                  key={title}
                  variants={item}
                  className="group rounded-2xl border border-border bg-background p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-card"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <motion.div
            className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {features.slice(0, 4).map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={item}
                className="group rounded-2xl border border-border/80 bg-background/90 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-card"
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Learning flow */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-cyan-50/20 to-background px-4 py-12 md:py-12">
        <div className="pointer-events-none absolute -left-20 top-12 h-56 w-56 rounded-full bg-primary/12 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-52 w-52 -translate-x-1/2 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="container relative mx-auto grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <div className="rounded-3xl border border-primary/12 bg-gradient-to-br from-white/95 to-cyan-50/45 p-5 shadow-[0_10px_24px_hsl(200_40%_35%_/_0.08)] backdrop-blur-sm lg:order-1 md:p-7">
            <div className="space-y-4">
              {learningSteps.map(({ icon: Icon, title, desc }, index) => {
                const isLast = index === learningSteps.length - 1;

                return (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: index * 0.08 }}
                    viewport={{ once: true, amount: 0.22 }}
                    className="group relative rounded-2xl border border-primary/12 bg-white/90 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/28 hover:shadow-[0_8px_20px_hsl(190_55%_40%_/_0.10)] md:p-6"
                  >
                    {!isLast && <div className="absolute left-[1.45rem] top-[4.2rem] h-[calc(100%-3.1rem)] w-px bg-gradient-to-b from-primary/30 via-primary/20 to-transparent" />}

                    <div className="flex items-start gap-4">
                      <div className="relative mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/18 bg-gradient-to-br from-primary/15 to-sky-300/14 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground">{title}</h3>
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-primary/22 bg-gradient-to-br from-primary/14 to-sky-300/18 font-heading text-sm font-bold text-primary/75">
                            0{index + 1}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            viewport={{ once: true, amount: 0.3 }}
            className="feature-hero-panel h-fit rounded-3xl p-7 lg:order-2 lg:sticky lg:top-24"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/24 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/95">
              <CheckCircle2 className="h-4 w-4" />
              Quy trình học rõ ràng
            </div>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-white/95 md:text-3xl">
              3 bước học từ vựng dễ duy trì
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/85 md:text-base">
              Tập trung vào nhịp học ổn định mỗi ngày, thay vì học dồn rồi nhanh quên. Mỗi bước đều ngắn gọn, đo lường được.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {['15 phút/ngày', 'Ôn đúng lúc', 'Theo dõi tiến bộ'].map((pill) => (
                <span key={pill} className="rounded-full border border-white/35 bg-white/20 px-3 py-1 text-xs font-semibold text-white/95 shadow-sm">
                  {pill}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-14 md:py-16">
        <div className="container mx-auto">
          <motion.div
            className="cta-english relative overflow-hidden rounded-3xl px-8 py-12 md:px-12 md:py-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="cta-english-pattern" />
            <div className="relative z-10 grid items-center gap-12 md:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <p className="text-sm font-semibold tracking-[0.08em] text-white/75">English learning</p>
                <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
                  Lộ trình học tiếng Anh
                  <br />
                  rõ ràng và thú vị hơn
                </h2>
                <p className="max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
                  Học từ vựng, phát âm và ngữ cảnh trong một lộ trình liền mạch. Ngắn gọn, đẹp mắt, dễ theo dõi mỗi ngày.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button asChild size="lg" className="cta-button px-8 text-lg font-semibold hover:!text-sky-700">
                      <Link to="/sets">Khám phá ngay →</Link>
                    </Button>
                  </motion.div>
                  <span className="text-sm font-medium tracking-[0.03em] text-white/75">Miễn phí bắt đầu</span>
                </div>
              </div>
              <motion.div
                className="relative h-[300px] w-full max-w-lg justify-self-center md:h-[340px]"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                viewport={{ once: true }}
              >
                <div className="cta-card cta-card-main">
                  <div className="cta-card-label">Vocabulary</div>
                  <h3 className="cta-card-title">Ubiquitous</h3>
                  <p className="cta-card-sub">/juːˈbɪk.wɪ.təs/</p>
                  <p className="cta-card-desc">Có mặt ở khắp nơi, phổ biến trong đời sống.</p>
                </div>
                <div className="cta-card cta-card-quiz">
                  <div className="cta-card-label">Mini quiz</div>
                  <div className="cta-choice">Everywhere</div>
                  <div className="cta-choice cta-choice-muted">Rarely</div>
                </div>
                <div className="cta-card cta-card-progress">
                  <div className="cta-card-label">Today</div>
                  <div className="cta-progress">
                    <span />
                  </div>
                  <p className="cta-card-sub">12/20 words</p>
                </div>
                <div className="cta-bubble">Let’s practice!</div>
                <div className="cta-letter cta-letter-a">Aa</div>
                <div className="cta-letter cta-letter-b">Bb</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative overflow-hidden border-t border-border/70 bg-card/70 px-4 py-12 md:py-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="pointer-events-none absolute -left-28 top-8 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-4 h-44 w-44 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="container relative mx-auto">
          <motion.div
            className="rounded-3xl border border-border/80 bg-background/95 p-7 shadow-card md:p-10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr] lg:gap-9">
              <motion.div
                className="space-y-5"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Link
                  to="/"
                  className=" items-center px-3 py-2 shadow-sm transition-all duration-300 hover:-translate-y-0.5"
                >
                  <img
                    src="/logo_minlish.png"
                    alt="MinLish"
                    className="block h-11 w-auto object-contain"
                  />
                </Link>
                <p className="max-w-sm text-[0.95rem] leading-relaxed text-muted-foreground">
                  Học tiếng Anh mỗi ngày bằng lộ trình ngắn gọn, trực quan và có nhịp ôn thông minh theo Spaced Repetition.
                </p>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-semibold tracking-[0.04em] text-primary">
                  Gói miễn phí sẵn sàng
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h4 className="mb-5 font-heading text-base font-semibold tracking-tight text-foreground">Khám phá</h4>
                <ul className="space-y-3.5">
                  <li><Link to="/sets" className="text-[0.95rem] text-muted-foreground transition-colors hover:text-primary">Bộ từ vựng</Link></li>
                  <li><Link to="/sets" className="text-[0.95rem] text-muted-foreground transition-colors hover:text-primary">Phiên học</Link></li>
                  <li><Link to="/dashboard" className="text-[0.95rem] text-muted-foreground transition-colors hover:text-primary">Bảng tiến độ</Link></li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h4 className="mb-5 font-heading text-base font-semibold tracking-tight text-foreground">Tài nguyên</h4>
                <ul className="space-y-3.5">
                  <li><a href="#" className="text-[0.95rem] text-muted-foreground transition-colors hover:text-primary">Hướng dẫn bắt đầu</a></li>
                  <li><a href="#" className="text-[0.95rem] text-muted-foreground transition-colors hover:text-primary">Mẹo học từ vựng</a></li>
                  <li><a href="#" className="text-[0.95rem] text-muted-foreground transition-colors hover:text-primary">Câu hỏi thường gặp</a></li>
                </ul>
              </motion.div>

              <motion.div
                className="space-y-5"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div>
                  <h4 className="font-heading text-base font-semibold tracking-tight text-foreground">Kết nối với MinLish</h4>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Nhận cập nhật mẹo học nhanh và nội dung mới mỗi tuần.</p>
                </div>
                <div className="flex items-center gap-3">
                  <motion.a
                    href="#"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground/70 shadow-sm transition-all hover:-translate-y-1 hover:border-primary hover:bg-primary hover:text-primary-foreground"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Twitter className="h-5 w-5" />
                  </motion.a>
                  <motion.a
                    href="#"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground/70 shadow-sm transition-all hover:-translate-y-1 hover:border-primary hover:bg-primary hover:text-primary-foreground"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Github className="h-5 w-5" />
                  </motion.a>
                  <motion.a
                    href="#"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground/70 shadow-sm transition-all hover:-translate-y-1 hover:border-primary hover:bg-primary hover:text-primary-foreground"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Mail className="h-5 w-5" />
                  </motion.a>
                </div>
              </motion.div>
            </div>

            <motion.div
              className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-7 text-center sm:flex-row sm:text-left"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <p className="text-sm font-medium text-muted-foreground/80">
                © {new Date().getFullYear()} MinLish. Học từ vựng thông minh hơn mỗi ngày.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <a href="#" className="text-sm font-medium text-muted-foreground/80 transition-colors hover:text-foreground">Điều khoản Dịch vụ</a>
                <a href="#" className="text-sm font-medium text-muted-foreground/80 transition-colors hover:text-foreground">Chính sách Bảo mật</a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
