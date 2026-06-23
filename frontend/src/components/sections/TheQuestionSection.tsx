import SectionLabel from "../SectionLabel"
import MathText from "../MathText"

interface Props {
  content: string
}

// The open problem the post addresses, as a labeled prose section with inline
// $...$ math allowed. For the questions format the_question is the page headline
// and is filtered out of the body (rendered in the header), so this labeled-prose
// form is what Academy's the_question (a multi-sentence section) renders as.
export default function TheQuestionSection({ content }: Props) {
  return (
    <div className="px-6 py-8">
      <SectionLabel className="mb-3">The Question</SectionLabel>
      <p className="prose-post text-ink-dim">
        <MathText text={content} />
      </p>
    </div>
  )
}
