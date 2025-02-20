import { Document, Page, Text, View, StyleSheet, Font, Link as PdfLink } from '@react-pdf/renderer';
import { marked, Tokens } from 'marked';

// Register font for Chinese support
Font.register({
  family: 'Noto Sans TC',
  src: 'https://fonts.gstatic.com/ea/notosanstc/v1/NotoSansTC-Regular.otf'
});

// Create PDF styles
const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: 'Noto Sans TC',
  },
  section: {
    marginBottom: 10,
  },
  heading1: {
    fontSize: 24,
    marginBottom: 16,
    fontWeight: 'bold',
    paddingTop: 16,
    fontFamily: 'Noto Sans TC',
  },
  heading2: {
    fontSize: 20,
    marginBottom: 12,
    fontWeight: 'bold',
    paddingTop: 12,
    fontFamily: 'Noto Sans TC',
  },
  heading3: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
    paddingTop: 10,
    fontFamily: 'Noto Sans TC',
  },
  paragraph: {
    marginBottom: 10,
    lineHeight: 1.8,
    fontFamily: 'Noto Sans TC',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  text: {
    fontFamily: 'Noto Sans TC',
  },
  char: {
    fontFamily: 'Noto Sans TC',
  },
  code: {
    fontFamily: 'Courier',
    backgroundColor: '#f6f8fa',
    padding: 12,
    marginVertical: 12,
    fontSize: 10,
  },
  list: {
    marginLeft: 24,
    marginBottom: 12,
    marginTop: 8,
  },
  listItem: {
    marginBottom: 8,
    paddingLeft: 12,
    lineHeight: 1.4,
    fontFamily: 'Noto Sans TC',
  },
  emphasis: {
    fontStyle: 'italic',
    fontFamily: 'Helvetica',
  },
  strong: {
    fontWeight: 'bold',
    fontFamily: 'Noto Sans TC',
  },
  link: {
    color: '#0366d6',
    textDecoration: 'underline',
    fontFamily: 'Noto Sans TC',
  },
  blockquote: {
    marginLeft: 16,
    paddingLeft: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#dfe2e5',
    fontStyle: 'italic',
    color: '#6a737d',
    fontFamily: 'Noto Sans TC',
  },
  date: {
    fontFamily: 'Times-Italic',
    color: '#666666',
    marginBottom: 16,
    fontSize: 11,
  },
  hr: {
    borderTopWidth: 1,
    borderTopColor: '#dfe2e5',
    marginVertical: 20,
  },
  datePrefix: {
    fontWeight: 'bold',
    color: '#24292e',
    fontFamily: 'Noto Sans TC',
  },
});

interface PDFDocumentProps {
  title: string;
  content: string;
}

function renderInlineContent(text: string): React.ReactNode {
  try {
    // Handle inline styles
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\)|_.*?_)/);
    return parts.map((part, i) => {
      if (!part) return null;
      if (part.startsWith('**') && part.endsWith('**')) {
        return <Text key={i} style={styles.strong}>{part.slice(2, -2)}</Text>;
      }
      if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
        return <Text key={i} style={styles.emphasis}>{part.slice(1, -1)}</Text>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <Text key={i} style={styles.code}>{part.slice(1, -1)}</Text>;
      }
      if (part.match(/\[(.*?)\]\((.*?)\)/)) {
        const [, text, url] = part.match(/\[(.*?)\]\((.*?)\)/)!;
        const isInternalLink = url.startsWith('#');
        return isInternalLink ? (
          <PdfLink key={i} src={url} style={styles.link}>{text}</PdfLink>
        ) : (
          <Text key={i} style={styles.link}>{text}</Text>
        );
      }

      // Split text into segments of Chinese characters and non-Chinese text
      const segments = part.split(/([\\u4e00-\\u9fa5]+)/g).filter(Boolean);
      return segments.map((segment, segIndex) => {
        // Check if segment contains Chinese characters
        if (/[\u4e00-\u9fa5]/.test(segment)) {
          // Split Chinese characters
          return [...segment].map((char, charIndex) => (
            <Text key={`${i}-${segIndex}-${charIndex}`} style={styles.char}>{char}</Text>
          ));
        } else {
          // Keep English text together
          return <Text key={`${i}-${segIndex}`} style={styles.text}>{segment}</Text>;
        }
      });
    }).filter(Boolean);
  } catch (error) {
    console.error('Error in renderInlineContent:', error);
    return text;
  }
}

function renderToken(token: Tokens.Token, index: number): React.ReactNode {
  switch (token.type) {
    case 'heading': {
      const headingToken = token as Tokens.Heading;
      const headingLevel = `heading${headingToken.depth}` as keyof typeof styles;
      const HeadingStyle = styles[headingLevel] || styles.heading1;
      
      // Handle numbered headings (e.g., "1. Executive Summary")
      const headingText = headingToken.text;
      const sectionText = headingText.replace(/^\d+\.\s+/, '');  // Remove any leading numbers
      const headingId = sectionText.toLowerCase().replace(/\s+/g, '-');
      
      return (
        <Text key={index} id={headingId} style={HeadingStyle}>
          {renderInlineContent(headingText)}
        </Text>
      );
    }

    case 'paragraph': {
      const paragraphToken = token as Tokens.Paragraph;
      // Special handling for "_Date: date_" pattern
      const dateMatch = paragraphToken.text.match(/^_Date:\s+(.+)_$/);
      if (dateMatch) {
        return (
          <View key={index} style={styles.section}>
            <Text style={styles.date}>
              <Text style={styles.datePrefix}>Date: </Text>
              {dateMatch[1]}
            </Text>
          </View>
        );
      }
      
      // Otherwise handle regular paragraph
      return (
        <View key={index} style={styles.section}>
          <Text style={styles.paragraph}>
            {renderInlineContent(paragraphToken.text)}
          </Text>
        </View>
      );
    }

    case 'code': {
      const codeToken = token as Tokens.Code;
      return (
        <View key={index} style={styles.section}>
          <Text style={styles.code}>{codeToken.text}</Text>
        </View>
      );
    }

    case 'blockquote': {
      const blockquoteToken = token as Tokens.Blockquote;
      return (
        <View key={index} style={styles.section}>
          <Text style={styles.blockquote}>
            {renderInlineContent(blockquoteToken.text)}
          </Text>
        </View>
      );
    }

    case 'list': {
      const listToken = token as Tokens.List;
      return (
        <View key={index} style={styles.list}>
          {(listToken.items as Tokens.ListItem[]).map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Text>
                {listToken.ordered ? `${i + 1}. ` : '• '}
                {renderInlineContent(item.text)}
              </Text>
            </View>
          ))}
        </View>
      );
    }

    case 'hr':
      return <View key={index} style={styles.hr} />;

    default:
      return null;
  }
}

export default function PDFDocument({ title, content }: PDFDocumentProps) {
  const tokens = marked.lexer(content);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.heading1}>{title}</Text>
        {tokens.map((token, index) => renderToken(token, index))}
      </Page>
    </Document>
  );
}
