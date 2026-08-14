import { Fragment } from 'react';
import { parseMarkup } from '@/domain/markup';

interface Props {
  /** `[[...]]` 로 밑줄을 표기한 문항 텍스트 */
  children: string;
}

/**
 * 문항 텍스트를 밑줄까지 살려서 그린다.
 * 지시문이 "밑줄 친 부분"이라고 말하면 화면에도 실제로 밑줄이 보여야 한다.
 */
export default function RichText({ children }: Props) {
  return (
    <>
      {parseMarkup(children).map((segment, i) => (
        <Fragment key={i}>
          {segment.underline ? <u className="ul">{segment.text}</u> : segment.text}
        </Fragment>
      ))}
    </>
  );
}
