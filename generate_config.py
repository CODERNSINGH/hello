import os

CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.js')

def main():
    groq_api_key = os.getenv('GROQ_API_KEY')
    groq_api_url = os.getenv('GROQ_API_URL', 'https://api.groq.com/openai/v1/chat/completions')

    config_content = (
        "window.APP_CONFIG = window.APP_CONFIG || {\n"
        f"    GROQ_API_KEY: {repr(groq_api_key)},\n"
        f"    GROQ_API_URL: {repr(groq_api_url)}\n"
        "};\n"
    )

    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        f.write(config_content)

    print(f"Generated {CONFIG_FILE} with GROQ_API_URL={groq_api_url}")

if __name__ == '__main__':
    main()
