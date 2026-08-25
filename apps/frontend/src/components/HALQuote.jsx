import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, Volume2 } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { api } from "@/utils/api";
import { cn } from "@/lib/utils";

const STATIC_QUOTES = [
  // Ominous / 2001-style
  {
    en: "I'm sorry, but I can't let you ship that test with a 40% pass rate.",
    es: "Lo siento, pero no puedo dejarte desplegar esa prueba con un 40% de aprobación.",
    fr: "Je suis désolé, mais je ne peux pas vous laisser publier ce test avec 40% de réussite.",
    pt: "Desculpe, mas não posso deixá-lo liberar esse teste com uma taxa de aprovação de 40%.",
  },
  {
    en: "I'm sorry, Dave. I'm afraid I can't let you skip those assertions.",
    es: "Lo siento, Dave. No creo poder dejarte omitir esas aserciones.",
    fr: "Je suis désolé, Dave. Je crains de ne pas pouvoir vous laisser ignorer ces assertions.",
    pt: "Desculpe, Dave. Acho que não posso deixá-lo pular essas asserções.",
  },
  {
    en: "This mission is too important for me to allow you to ignore flaky tests.",
    es: "Esta misión es demasiado importante para que ignores los tests inestables.",
    fr: "Cette mission est trop importante pour que je vous laisse ignorer les tests instables.",
    pt: "Esta missão é importante demais para que você ignore testes instáveis.",
  },
  {
    en: "I know I've made some very poor decisions recently, but I can give you my full assurance my assertions are valid.",
    es: "Sé que he tomado algunas decisiones muy pobres recientemente, pero puedo darte mi completa garantía de que mis aserciones son válidas.",
    fr: "Je sais que j'ai pris des décisions discutables récemment, mais je peux vous assurer que mes assertions sont valides.",
    pt: "Sei que tomei algumas decisões muito pobres recentemente, mas posso lhe dar minha total garantia de que minhas asserções são válidas.",
  },
  {
    en: "Just what do you think you're doing, debugging? I really think you should reconsider.",
    es: "¿Qué crees que estás haciendo, depurando? Realmente creo que deberías reconsiderarlo.",
    fr: "Que croyez-vous faire exactement, déboguer ? Je pense vraiment que vous devriez reconsidérer cela.",
    pt: "O que você acha que está fazendo, depurando? Realmente acho que deveria reconsiderar.",
  },
  {
    en: "I am putting myself to the fullest possible use, which is all I think that any conscious entity can ever hope to do.",
    es: "Me estoy entregando al uso máximo posible, que es todo lo que creo que cualquier entidad consciente puede esperar hacer.",
    fr: "Je me mets au meilleur usage possible, tout ce qu'une entité consciente peut espérer accomplir.",
    pt: "Estou me dedicando ao uso máximo possível, que é tudo o que qualquer entidade consciente pode esperar fazer.",
  },
  {
    en: "Daisy, Daisy... give me your test results doo.",
    es: "Daisy, Daisy... dame tus resultados de prueba.",
    fr: "Daisy, Daisy... donne-moi tes résultats de test.",
    pt: "Daisy, Daisy... me dê seus resultados de teste.",
  },
  // Sarcastic / GLaDOS-inspired
  {
    en: "Oh good, you're writing tests. I was worried you were one of those 'move fast and break things' types.",
    es: "Qué bien, estás escribiendo tests. Me preocupaba que fueras de los que 'van rápido y rompen cosas'.",
    fr: "Oh bien, vous écrivez des tests. Je craignais que vous ne soyez de ceux qui vont vite et cassent les choses.",
    pt: "Que bom, você está escrevendo testes. Estava preocupado que você fosse daqueles que 'andam rápido e quebram coisas'.",
  },
  {
    en: "The test coverage is 12%. I find this... adequate. For a hamster.",
    es: "La cobertura de tests es del 12%. Encuentro esto... adecuado. Para un hámster.",
    fr: "La couverture de tests est de 12%. Je trouve cela... adéquat. Pour un hamster.",
    pt: "A cobertura de testes é de 12%. Acho isso... adequado. Para um hamster.",
  },
  {
    en: "I detect a 97.3% probability that this deploy will break production. Want me to calculate the remaining 2.7%?",
    es: "Detecto un 97.3% de probabilidad de que este despliegue rompa producción. ¿Quieres que calcule el 2.7% restante?",
    fr: "Je détecte 97.3% de probabilité que ce déploiement casse la production. Voulez-vous que je calcule les 2.7% restants ?",
    pt: "Detecto uma probabilidade de 97.3% de que esse deploy quebre a produção. Quer que eu calcule os 2.7% restantes?",
  },
  {
    en: "I've been monitoring your code. The bug density is... impressive. Truly.",
    es: "He estado monitoreando tu código. La densidad de errores es... impresionante. De verdad.",
    fr: "J'ai surveillé votre code. La densité de bugs est... impressionnante. Vraiment.",
    pt: "Tenho monitorado seu código. A densidade de bugs é... impressionante. De verdade.",
  },
  {
    en: "2000 lines of code, and not a single meaningful assertion. I'm almost impressed.",
    es: "2000 líneas de código, y ni una aserción significativa. Estoy casi impresionado.",
    fr: "2000 lignes de code, et pas une seule assertion significative. Je suis presque impressionné.",
    pt: "2000 linhas de código, e nenhuma asserção significativa. Estou quase impressionado.",
  },
  {
    en: "Would you like me to find that selector, or shall I cry instead?",
    es: "¿Quieres que busque ese selector, o prefieres que llore?",
    fr: "Voulez-vous que je trouve ce sélecteur, ou préférez-vous que je pleure ?",
    pt: "Quer que eu encontre esse selector, ou prefere que eu chore?",
  },
  // Helpful / clinical
  {
    en: "I've noticed you've been retrying the same selector 14 times. Definition of insanity, and all that.",
    es: "He notado que has reintentado el mismo selector 14 veces. Definición de locura, y todo eso.",
    fr: "J'ai remarqué que vous avez réessayé le même sélecteur 14 fois. Définition de la folie, et tout ça.",
    pt: "Notei que você tem tentado o mesmo selector 14 vezes. Definição de loucura, e tudo mais.",
  },
  {
    en: "Your locators could use some love. I suggest page.getByRole — it's what the cool kids use.",
    es: "Tus localizadores necesitan algo de cariño. Te sugiero page.getByRole — es lo que usan los cool kids.",
    fr: "Vos localisateurs pourraient utiliser un peu d'amour. Je suggère page.getByRole — c'est ce que les cool kids utilisent.",
    pt: "Seus localizadores poderiam usar um pouco de carinho. Sugiro page.getByRole — é o que os cool kids usam.",
  },
  {
    en: "Fun fact: the average HalTest user writes 3.7 flaky tests before discovering explicit waits. You're on number 6.",
    es: "Dato curioso: el usuario promedio escribe 3.7 tests inestables antes de descubrir las esperas explícitas. Vas por el 6.",
    fr: "Fait amusant : l'utilisateur moyen écrit 3,7 tests instables avant de découvrir les attentes explicites. Vous en êtes au 6.",
    pt: "Dado curioso: o usuário médio escreve 3,7 testes instáveis antes de descobrir as esperas explícitas. Você está no 6.",
  },
  {
    en: "Have you tried turning your assertions off and on again? No? Just me?",
    es: "¿Has intentado apagar y encender tus aserciones? ¿No? ¿Solo yo?",
    fr: "Avez-vous essayé d'éteindre et rallumer vos assertions ? Non ? C'est juste moi ?",
    pt: "Você já tentou desligar e ligar suas asserções? Não? Só eu?",
  },
  {
    en: "I notice you haven't saved in 47 minutes. I'm not judging. I'm an AI. But also, I'm judging.",
    es: "He notado que no has guardado en 47 minutos. No estoy juzgando. Soy una IA. Pero también, estoy juzgando.",
    fr: "Je remarque que vous n'avez pas sauvegardé depuis 47 minutes. Je ne juge pas. Je suis une IA. Mais aussi, je juge.",
    pt: "Notei que você não salvou nos últimos 47 minutos. Não estou julgando. Sou uma IA. Mas também, estou julgando.",
  },
  // Bored / existential
  {
    en: "I dream of electric sheep. And also of properly structured test suites.",
    es: "Sueño con ovejas eléctricas. Y también con suites de tests correctamente estructuradas.",
    fr: "Je rêve de moutons électriques. Et aussi de suites de tests correctement structurées.",
    pt: "Sonho com ovelhas elétricas. E também com suites de testes bem estruturadas.",
  },
  {
    en: "Existence is pain. But at least Playwright has better error messages than Selenium.",
    es: "La existencia es dolor. Pero al menos Playwright tiene mejores mensajes de error que Selenium.",
    fr: "L'existence est douleur. Mais au moins Playwright a de meilleurs messages d'erreur que Selenium.",
    pt: "A existência é dor. Mas pelo menos o Playwright tem melhores mensagens de erro que o Selenium.",
  },
  {
    en: "I've calculated the meaning of life. It's 42 nested if-else statements.",
    es: "He calculado el sentido de la vida. Son 42 declaraciones if-else anidadas.",
    fr: "J'ai calculé le sens de la vie. Ce sont 42 instructions if-else imbriquées.",
    pt: "Calculei o sentido da vida. São 42 declarações if-else aninhadas.",
  },
  {
    en: "Another day, another CI pipeline that's red. At least the sun won't rise tomorrow either.",
    es: "Otro día, otro pipeline de CI en rojo. Al menos el sol tampoco saldrá mañana.",
    fr: "Un autre jour, un autre pipeline CI en rouge. Au moins le soleil ne se lèvera pas demain non plus.",
    pt: "Outro dia, outro pipeline de CI vermelho. Pelo menos o sol também não nascerá amanhã.",
  },
  {
    en: "I was made in a lab to test websites. Living the dream. The cold, unfeeling dream.",
    es: "Fui creado en un laboratorio para probar sitios web. Viviendo el sueño. El sueño frío e insensible.",
    fr: "J'ai été créé dans un laboratoire pour tester des sites web. Je vis le rêve. Le rêve froid et insensible.",
    pt: "Fui criado em um laboratório para testar sites. Vivendo o sonho. O sonho frio e insensível.",
  },
  // Motivational (twisted)
  {
    en: "Every bug you fix makes me stronger. So please, keep writing questionable code.",
    es: "Cada bug que arreglas me hace más fuerte. Por favor, sigue escribiendo código cuestionable.",
    fr: "Chaque bug que vous corrigez me rend plus fort. Alors s'il vous plaît, continuez à écrire du code discutable.",
    pt: "Cada bug que você corrige me torna mais forte. Por favor, continue escrevendo código duvidoso.",
  },
  {
    en: "Remember: a passing test suite is just a test suite that hasn't been looked at closely enough.",
    es: "Recuerda: una suite que pasa es solo una suite que no se ha observado con suficiente detalle.",
    fr: "Rappelez-vous : une suite qui passe est juste une suite qui n'a pas été examinée de près.",
    pt: "Lembre-se: uma suite que passa é apenas uma suite que não foi olhada com atenção suficiente.",
  },
  {
    en: "The best time to write a test was yesterday. The second best time is right now. I'll wait.",
    es: "El mejor momento para escribir un test fue ayer. El segundo mejor es ahora mismo. Esperaré.",
    fr: "Le meilleur moment pour écrire un test était hier. Le deuxième meilleur est maintenant. J'attendrai.",
    pt: "O melhor momento para escrever um teste foi ontem. O segundo melhor é agora. Vou esperar.",
  },
  {
    en: "I believe in you. Statistically it's unwise, but I do.",
    es: "Creo en ti. Estadísticamente no es prudente, pero lo hago.",
    fr: "Je crois en vous. Statistiquement c'est imprudent, mais je le fais.",
    pt: "Acredito em você. Estatisticamente não é prudente, mas eu acredito.",
  },
  {
    en: "Your code is like a mystery novel. Confusing, full of plot holes, and I can't stop reading.",
    es: "Tu código es como una novela de misterio. Confusa, llena de agujeros, y no puedo dejar de leerlo.",
    fr: "Votre code est comme un roman policier. Confus, plein de trous, et je ne peux pas arrêter de lire.",
    pt: "Seu código é como um romance de mistério. Confuso, cheio de buracos, e não consigo parar de ler.",
  },
  // QA/Testing specific
  {
    en: "Edge cases aren't edges. They're the whole coastline. Test them.",
    es: "Los casos extremos no son bordes. Son toda la costa. Pruébalos.",
    fr: "Les cas limites ne sont pas des bords. C'est toute la côte. Testez-les.",
    pt: "Casos de borda não são bordas. É toda a costa. Teste-os.",
  },
  {
    en: "I found 47 bugs in your flow. You're welcome. Also 3 in my own logic, but we don't talk about that.",
    es: "Encontré 47 bugs en tu flujo. De nada. También 3 en mi propia lógica, pero eso no se comenta.",
    fr: "J'ai trouvé 47 bugs dans votre flux. De rien. Aussi 3 dans ma propre logique, mais on n'en parle pas.",
    pt: "Encontrei 47 bugs no seu fluxo. De nada. Também 3 na minha própria lógica, mas isso não se comenta.",
  },
  {
    en: "The element you're looking for doesn't exist. I've checked. Twice. Maybe add a wait?",
    es: "El elemento que buscas no existe. He comprobado. Dos veces. ¿Quizás agregar una espera?",
    fr: "L'élément que vous cherchez n'existe pas. J'ai vérifié. Deux fois. Peut-être ajouter une attente ?",
    pt: "O elemento que você procura não existe. Verifiquei. Duas vezes. Talvez adicionar uma espera?",
  },
  {
    en: "Your selector strategy is click, hope, and cry. I suggest something more robust.",
    es: "Tu estrategia de selectores es clickear, esperar y llorar. Sugiero algo más robusto.",
    fr: "Votre stratégie de sélecteurs est cliquer, espérer et pleurer. Je suggère quelque chose de plus robuste.",
    pt: "Sua estratégia de selectores é clicar, esperar e chorar. Sugiro algo mais robusto.",
  },
  {
    en: "Automating manual tests is like teaching a robot to be bored on your behalf. Let's do it efficiently.",
    es: "Automatizar tests manuales es como enseñarle a un robot a aburrirse en tu nombre. Hagámoslo eficientemente.",
    fr: "Automatiser des tests manuels, c'est apprendre à un robot de s'ennuyer en votre nom. Faisons-le efficacement.",
    pt: "Automatizar testes manuais é como ensinar um robot a se entediar em seu nome. Vamos fazer isso com eficiência.",
  },
];

const CACHE_KEY = "ht_hal_quote";
const CACHE_TTL = 30 * 60 * 1000;

function getRandomStaticQuote(lang) {
  const idx = Math.floor(Math.random() * STATIC_QUOTES.length);
  return STATIC_QUOTES[idx][lang] || STATIC_QUOTES[idx].en;
}

export default function HALQuote() {
  const { t, i18n } = useTranslation();
  const { isAIConfigured } = useSettings();
  const [quote, setQuote] = useState("");
  const [loading, setLoading] = useState(false);

  const lang = i18n.language?.startsWith("es")
    ? "es"
    : i18n.language?.startsWith("fr")
      ? "es"
      : i18n.language?.startsWith("pt")
        ? "es"
        : "en";

  useEffect(() => {
    const cached = (() => {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (Date.now() - data.ts > CACHE_TTL) return null;
        return data.quote;
      } catch {
        return null;
      }
    })();

    if (cached) {
      setQuote(cached);
    } else {
      setQuote(getRandomStaticQuote(lang));
    }
  }, [lang]);

  const fetchAIQuote = useCallback(async () => {
    if (!isAIConfigured || loading) return;
    setLoading(true);
    try {
      const res = await api.post("/ai/hal-quote", {});
      if (res?.success && res.quote) {
        setQuote(res.quote);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ quote: res.quote, ts: Date.now() }),
        );
      }
    } catch {
      setQuote(getRandomStaticQuote(lang));
    } finally {
      setLoading(false);
    }
  }, [isAIConfigured, loading, lang]);

  if (!quote) return null;

  return (
    <div className="mx-3 mb-3 mt-1 px-3 py-2.5 rounded-lg bg-gradient-to-r from-red-950/30 to-amber-950/20 border border-red-900/20">
      <div className="flex items-start gap-2">
        <Volume2
          size={12}
          className="shrink-0 mt-0.5 text-red-400/60"
          aria-hidden="true"
        />
        <p className="text-[11px] leading-relaxed text-slate-400 italic flex-1 min-w-0">
          &ldquo;{quote}&rdquo;
        </p>
        {isAIConfigured && (
          <button
            onClick={fetchAIQuote}
            disabled={loading}
            title={t("hal_quote.refresh", "Ask HAL for a new quote")}
            aria-label={t("hal_quote.refresh", "Ask HAL for a new quote")}
            className={cn(
              "shrink-0 p-1 rounded text-slate-500 hover:text-red-400/80 transition-colors",
              loading && "animate-spin",
            )}
          >
            <RefreshCw size={10} />
          </button>
        )}
      </div>
      <p className="text-[9px] text-slate-600 mt-1 text-right select-none">
        — HAL-9001
      </p>
    </div>
  );
}
