interface Props {
  content: string
}

export default function QuizBadgeSection({ content }: Props) {
  return (
    <div className="px-5 pb-2 flex justify-center">
      <span className="inline-block bg-(--accent)/15 border border-(--accent)/40 text-(--accent) text-sm font-medium px-4 py-1.5 rounded-full">
        {content}
      </span>
    </div>
  )
}
