import { mystParse } from 'myst-parser';
import { cardDirective, splitParagraphNode } from 'myst-ext-card';

describe('card directive', () => {
  it('card directive parses', async () => {
    const content = '```{card} Card Title\nHeader\n^^^\nCard content\n+++\nFooter\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          name: 'card',
          args: 'Card Title',
          value: 'Header\n^^^\nCard content\n+++\nFooter',
          position: {
            start: {
              line: 0,
              column: 0,
            },
            end: {
              line: 7,
              column: 0,
            },
          },
          children: [
            {
              type: 'card',
              children: [
                {
                  type: 'header',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'text',
                          value: 'Header',
                        },
                      ],
                      position: {
                        end: {
                          column: 0,
                          line: 4,
                        },
                        start: {
                          column: 0,
                          line: 1,
                        },
                      },
                    },
                  ],
                },
                {
                  type: 'cardTitle',
                  children: [
                    {
                      type: 'text',
                      value: 'Card Title',
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      value: 'Card content',
                    },
                  ],
                  position: {
                    end: {
                      column: 0,
                      line: 4,
                    },
                    start: {
                      column: 0,
                      line: 1,
                    },
                  },
                },
                {
                  type: 'footer',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'text',
                          value: 'Footer',
                        },
                      ],
                      position: {
                        end: {
                          column: 0,
                          line: 6,
                        },
                        start: {
                          column: 0,
                          line: 5,
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const output = mystParse(content, {
      directives: [cardDirective],
    });
    console.log(JSON.stringify(output, null, 2));
    expect(output).toEqual(expected);
  });
  it('card directive parses with options', async () => {
    const content =
      '```{card} Card Title\n:header: Header\n:footer: Footer\n:link: my-url\nCard content\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          name: 'card',
          args: 'Card Title',
          options: {
            header: 'Header',
            footer: 'Footer',
            link: 'my-url',
          },
          value: 'Card content',
          position: {
            start: {
              line: 0,
              column: 0,
            },
            end: {
              line: 6,
              column: 0,
            },
          },
          children: [
            {
              type: 'card',
              url: 'my-url',
              children: [
                {
                  type: 'header',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'text',
                          value: 'Header',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: 'cardTitle',
                  children: [
                    {
                      type: 'text',
                      value: 'Card Title',
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      value: 'Card content',
                    },
                  ],
                  position: {
                    end: {
                      column: 0,
                      line: 5,
                    },
                    start: {
                      column: 0,
                      line: 4,
                    },
                  },
                },
                {
                  type: 'footer',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'text',
                          value: 'Footer',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const output = mystParse(content, {
      directives: [cardDirective],
    });
    console.log(JSON.stringify(output, null, 2));
    expect(output).toEqual(expected);
  });
  it('card directive parses with minimal content', async () => {
    const content = '```{card}\nCard content\n```';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'mystDirective',
          name: 'card',
          value: 'Card content',
          position: {
            start: {
              line: 0,
              column: 0,
            },
            end: {
              line: 3,
              column: 0,
            },
          },
          children: [
            {
              type: 'card',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      value: 'Card content',
                    },
                  ],
                  position: {
                    end: {
                      column: 0,
                      line: 2,
                    },
                    start: {
                      column: 0,
                      line: 1,
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    };
    const output = mystParse(content, {
      directives: [cardDirective],
    });
    console.log(JSON.stringify(output, null, 2));
    expect(output).toEqual(expected);
  });
});

describe('splitParagraphNode', () => {
  it('non-text nodes pass', async () => {
    const input = {
      type: 'paragraph',
      children: [
        {
          type: 'emphasis',
          children: [
            {
              type: 'text',
              value: 'abc\n^^^\ndef',
            },
          ],
        },
      ],
    };
    expect(splitParagraphNode(input, '^^^')).toEqual([input, null]);
  });
  it('middle delim node splits', async () => {
    const input = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'abc\n^^^\ndef',
        },
      ],
    };
    const before = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'abc',
        },
      ],
    };
    const after = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'def',
        },
      ],
    };
    expect(splitParagraphNode(input, '^^^')).toEqual([before, after]);
  });
  it('start delim node splits', async () => {
    const input = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: '^^^\ndef',
        },
      ],
    };
    const after = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'def',
        },
      ],
    };
    expect(splitParagraphNode(input, '^^^')).toEqual([null, after]);
  });
  it('end delim node splits', async () => {
    const input = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'abc\n^^^',
        },
      ],
    };
    const before = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'abc',
        },
      ],
    };
    expect(splitParagraphNode(input, '^^^')).toEqual([before, null]);
  });
  it('other nodes remain, including additional delim matches', async () => {
    const input = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: '123',
        },
        {
          type: 'text',
          value: 'abc\n^^^\ndef',
        },
        {
          type: 'text',
          value: '456\n^^^\n789',
        },
      ],
    };
    const before = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: '123',
        },
        {
          type: 'text',
          value: 'abc',
        },
      ],
    };
    const after = {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          value: 'def',
        },
        {
          type: 'text',
          value: '456\n^^^\n789',
        },
      ],
    };
    expect(splitParagraphNode(input, '^^^')).toEqual([before, after]);
  });
});
