export default function CodeBlock({ text }: { text: string }) {
    return (
        <pre className="bg-black text-white rounded-md p-3 overflow-auto text-xs leading-relaxed">
        {text}
        </pre>
    );
}
