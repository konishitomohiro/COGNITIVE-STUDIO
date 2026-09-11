import { LectureStudyData } from '../types';

export const SAMPLE_LECTURE_DATA: LectureStudyData = {
  title: "認知心理学第4回：ワーキングメモリの構造と長期記憶への転送",
  core_points: [
    "ワーキングメモリ（作業記憶）は情報の維持と操作を同時に行う限られた容量のシステムである。",
    "バドリー（Baddeley）のモデルでは、中央実行系、音韻ループ、視空間スケッチパッド、エピソードバッファの4要素で構成される。",
    "ワーキングメモリの過負荷（Cognitive Overload）を防ぐため、情報はチャンク化（意味のあるまとまり）して処理することが重要である。",
    "長期記憶への定着には、機械的暗記ではなく、既存の知識体系と結びつける「精緻化リハーサル」が効果的である。",
    "思い出す作業そのものが記憶回路を強化する「アクティブリコール（能動的想起）」は、単なる再読の3倍以上の学習効果を持つ。"
  ],
  key_terms: [
    {
      term: "ワーキングメモリ (Working Memory)",
      definition: "短時間情報を保持しながら、推論や理解などの複雑な認知課題を実行する意識的作業領域。",
      isAbstract: true,
      abstractExplanation: {
        isAbstract: true,
        lowAbstractionExplanation: "頭の中にある『一時的な作業デスク』。計算や会話をするときに、一時的に情報を置いて作業し、終わったら消える部屋のようなものです。",
        concreteExample: "暗算で『17 + 28』を計算するとき、17と28という数字を頭の中に浮かべて保持しながら計算を進める脳のスペース。",
        analogy: "パソコンの『RAM（作業用メモリ）』。アプリを開いて作業している間だけデータを保つ領域。",
        whyImportant: "思考や理解の限界を決める場所であり、容量オーバー（認知過負荷）を防ぐ工夫が必要不可欠です。"
      }
    },
    {
      term: "中央実行系 (Central Executive)",
      definition: "ワーキングメモリの核心部であり、注意の制御、課題の切替、サブシステムの統括を担う。",
      isAbstract: true,
      abstractExplanation: {
        isAbstract: true,
        lowAbstractionExplanation: "ワーキングメモリの中の『最高司令官（監督）』。どの仕事に集中するか、次にどの作業に切り替えるかを命令します。",
        concreteExample: "料理をしながらタイマーが鳴った時、包丁の手を止めて鍋の火加減を優先するよう判断を下す脳のコントロールセンター。",
        analogy: "オーケストラの『指揮者』。各楽器（記憶のパーツ）の出番やテンポを統一する役目。",
        whyImportant: "マルチタスクや注意散漫を防ぎ、学習の集中力を維持するために最も重要な機能です。"
      }
    },
    {
      term: "音韻ループ (Phonological Loop)",
      definition: "言語的情報（音声・テキスト）を音韻短時記憶と音声リハーサルによって一時維持する領域。",
      isAbstract: true,
      abstractExplanation: {
        isAbstract: true,
        lowAbstractionExplanation: "声や文字の情報を、頭の中で何度もつぶやいて一時保存する『音声のルーパー（テープ）』。",
        concreteExample: "電話番号をメモ帳を探す数秒間、口の中で『090-XXXX-XXXX...』とぶつぶつ繰り返し唱えて忘れないようにする状態。",
        analogy: "頭の中の『ボイスメモ機能』。繰り返すことで音声を消えないようにリピート再生する。",
        whyImportant: "新しい単語や外国語、長文を読み解く際の基本エンジンとなります。"
      }
    },
    {
      term: "チャンキング (Chunking)",
      definition: "個別の情報要素を意味のある大きなカタマリ（チャンク）に結合し、記憶容量を節約する認知技法。",
      isAbstract: true,
      abstractExplanation: {
        isAbstract: true,
        lowAbstractionExplanation: "バラバラの細かい情報を、意味のある『グループ（箱）』にまとめて一気に覚えるテクニック。",
        concreteExample: "『1-9-4-5-0-8-1-5』という8桁のバラバラな数字を、『1945年（終戦の年）』と『0815（8月15日）』という2つの知っているグループにまとめて覚える。",
        analogy: "散らかった衣類を『夏服』『冬服』の衣装ケースにまとめて収納スペースを節約する作業。",
        whyImportant: "脳のメモリ上限（4〜7個）を実質的に何倍にも増やすことができる最強の記憶整理法です。"
      }
    },
    {
      term: "精緻化リハーサル (Elaborative Rehearsal)",
      definition: "新知識の意味を深く考え、既存の長期記憶の概念ネットワークと結びつける記憶符号化プロセス。",
      isAbstract: true,
      abstractExplanation: {
        isAbstract: true,
        lowAbstractionExplanation: "丸暗記するのではなく、自分の過去の体験や持っている知識と『繋げて深掘りする』記憶の工夫。",
        concreteExample: "英単語『reluctant（気が進まない）』を覚えるとき、雨の日に部活に行きたくなかった時の憂鬱な気持ちやエピソードと思い出させて覚える。",
        analogy: "新しく買った本を、本棚の関連するジャンル（既存の知識）のすぐ隣にフックでしっかり結びつけて保管すること。",
        whyImportant: "単なる丸暗記と異なり、一度覚えたら何年経っても忘れにくい強固な長期記憶を作ります。"
      }
    },
    {
      term: "アクティブリコール (Active Recall)",
      definition: "ヒントや解答を見ずに、自らの記憶から情報を引き出す（想起する）能動的テスト学習法。",
      isAbstract: true,
      abstractExplanation: {
        isAbstract: true,
        lowAbstractionExplanation: "教科書をただ眺めるのではなく、本を閉じて『自分の頭の中から一生懸命思い出す』学習アプローチ。",
        concreteExample: "単語帳の表面だけを見て、裏の答えを見ずに『うーん何だったっけ？』と自力で答えを思い出そうとするセルフテスト。",
        analogy: "脳の筋肉トレーニング。思い出そうと脳に負荷をかけることで、記憶の検索ルートが太く強くなる。",
        whyImportant: "再読するだけの学習に比べて3倍以上の記憶定着率を誇る、科学的に最も効果的な学習法です。"
      }
    }
  ]
};
