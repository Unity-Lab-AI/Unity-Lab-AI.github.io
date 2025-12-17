/**
 * services.js - Services page modals and contact form
 */

// Service Modal Data
var serviceData = {
    redteam: {
        icon: 'fas fa-user-secret',
        color: '#dc143c',
        title: 'Red Team Services',
        description: 'Our red team specialists conduct comprehensive adversarial testing on your AI systems to identify vulnerabilities, test guardrails, and expose potential jailbreak vectors. We employ advanced prompt injection techniques, context manipulation, and creative exploitation methods to ensure your AI can withstand real-world attacks. Our testing goes beyond standard security audits to include social engineering scenarios, edge case discovery, and systematic boundary testing.',
        benefits: [
            'Identify critical vulnerabilities before they\'re exploited',
            'Improve system robustness against adversarial attacks',
            'Understand your AI\'s failure modes and limitations',
            'Receive detailed reports with actionable remediation steps',
            'Test against real-world jailbreak techniques',
            'Validate safety guardrails and content filters'
        ],
        useCases: [
            'Pre-deployment security validation',
            'Ongoing security assessments for production systems',
            'Compliance and regulatory readiness',
            'Competitive analysis of AI safety measures',
            'Training data for blue team defenders'
        ],
        technical: [
            'Prompt injection and manipulation testing',
            'Context overflow and memory exploitation',
            'Guardrail bypass and jailbreak attempts',
            'Multi-turn conversation vulnerabilities',
            'Role-play and persona injection attacks',
            'Output validation and filter evasion',
            'Chain-of-thought exploitation techniques'
        ]
    },
    blueteam: {
        icon: 'fas fa-shield-halved',
        color: '#4169e1',
        title: 'Blue Team Services',
        description: 'Our blue team provides defensive AI security services, implementing robust safeguards and monitoring systems to protect your AI deployments. We design and implement multi-layered defense strategies including input validation, output filtering, content moderation, and real-time threat detection. Our approach combines proactive hardening with reactive monitoring to ensure your AI systems remain secure and compliant.',
        benefits: [
            'Prevent exploitation attempts before they succeed',
            'Maintain safe and compliant AI operations',
            'Implement industry-leading security practices',
            'Real-time threat detection and response',
            'Reduce risk of reputational damage',
            'Build user trust through demonstrable safety'
        ],
        useCases: [
            'AI system hardening and fortification',
            'Compliance with AI safety regulations',
            'Content moderation and filtering',
            'Production monitoring and incident response',
            'Safety-critical AI deployments'
        ],
        technical: [
            'Input sanitization and validation layers',
            'Output filtering and content moderation',
            'Rate limiting and abuse prevention',
            'Anomaly detection and behavioral monitoring',
            'Safety classifier integration',
            'Prompt template hardening',
            'Context isolation and sandboxing techniques'
        ]
    },
    integration: {
        icon: 'fas fa-plug',
        color: '#32cd32',
        title: 'AI Integration',
        description: 'We provide seamless AI integration services that connect cutting-edge language models and AI capabilities into your existing systems and workflows. Our integration approach focuses on flexibility, scalability, and maintainability, ensuring your AI augmentation fits naturally into your technology stack. We handle everything from API connectivity to custom middleware development, creating robust pipelines that enhance your applications without disrupting existing operations.',
        benefits: [
            'Enhance existing systems with AI capabilities',
            'Reduce development time and costs',
            'Scalable architecture for growing demands',
            'Maintain compatibility with legacy systems',
            'Future-proof integration patterns',
            'Minimize operational disruption'
        ],
        useCases: [
            'Adding AI chat to existing applications',
            'Automating content generation workflows',
            'Enhancing search with semantic capabilities',
            'Building AI-powered analytics dashboards',
            'Customer support automation'
        ],
        technical: [
            'RESTful API integration and middleware',
            'Webhook and event-driven architectures',
            'Custom endpoint development',
            'Authentication and access control',
            'Caching and rate limit optimization',
            'Error handling and fallback strategies',
            'Multi-model routing and load balancing'
        ]
    },
    chatbot: {
        icon: 'fas fa-comments',
        color: '#ff69b4',
        title: 'Chatbot Development',
        description: 'Our chatbot development services go far beyond basic question-and-answer systems. We create intelligent conversational AI with custom personalities, domain expertise, and advanced reasoning capabilities. Whether you need a customer service bot, internal knowledge assistant, or creative companion, we build chatbots that understand context, maintain coherent conversations, and provide genuinely useful interactions. Our bots can be deployed across multiple platforms and integrate with your existing tools and databases.',
        benefits: [
            'Provide 24/7 automated assistance',
            'Reduce support costs while improving quality',
            'Handle multiple conversations simultaneously',
            'Maintain consistent brand voice and personality',
            'Scale customer interactions effortlessly',
            'Gather valuable user insights and analytics'
        ],
        useCases: [
            'Customer service and support automation',
            'Internal knowledge base assistants',
            'E-commerce shopping assistants',
            'Educational and training bots',
            'Entertainment and creative companions'
        ],
        technical: [
            'Multi-turn conversation management',
            'Context window optimization',
            'Custom personality and persona design',
            'Intent classification and routing',
            'Sentiment analysis and tone adaptation',
            'Integration with databases and APIs',
            'Memory and state management systems'
        ]
    },
    agents: {
        icon: 'fas fa-robot',
        color: '#ffa500',
        title: 'Specialized Agents',
        description: 'We design and deploy specialized AI agents tailored to your unique requirements and use cases. These purpose-built agents combine language understanding with tool use, function calling, and domain-specific knowledge to accomplish complex tasks autonomously. Our agents can interact with external systems, process multi-step workflows, and make decisions within defined parameters. From research assistants to automation agents, we build AI that works as an extension of your team.',
        benefits: [
            'Automate complex, multi-step workflows',
            'Extend team capabilities without hiring',
            'Handle repetitive tasks with precision',
            'Operate autonomously within defined boundaries',
            'Integrate domain-specific expertise',
            'Adapt and improve through feedback'
        ],
        useCases: [
            'Research and data analysis agents',
            'Code generation and review assistants',
            'Content creation and editing workflows',
            'Data processing and transformation pipelines',
            'Monitoring and reporting automation'
        ],
        technical: [
            'Function calling and tool use frameworks',
            'RAG (Retrieval-Augmented Generation) systems',
            'Vector databases and semantic search',
            'Agent orchestration and chaining',
            'External API integration',
            'Feedback loops and reinforcement learning',
            'Task planning and execution strategies'
        ]
    },
    prompting: {
        icon: 'fas fa-wand-magic-sparkles',
        color: '#9370db',
        title: 'Prompt Engineering',
        description: 'Our prompt engineering experts craft optimized prompts that unlock your AI\'s full potential while minimizing costs and maximizing output quality. We employ advanced techniques including chain-of-thought reasoning, few-shot learning, and structured output formatting to achieve superior results. Our approach combines deep understanding of model capabilities with systematic testing and refinement to develop prompt strategies that work reliably across different scenarios and scale effectively.',
        benefits: [
            'Dramatically improve output quality and relevance',
            'Reduce token usage and operational costs',
            'Achieve consistent and predictable results',
            'Minimize hallucinations and errors',
            'Unlock advanced reasoning capabilities',
            'Transfer expertise without model training'
        ],
        useCases: [
            'Complex reasoning and analysis tasks',
            'Structured data extraction from text',
            'Content generation with specific formats',
            'Classification and categorization',
            'Creative writing with style constraints'
        ],
        technical: [
            'Chain-of-thought and reasoning frameworks',
            'Few-shot and zero-shot learning patterns',
            'System message optimization',
            'Structured output with JSON mode',
            'Role-based prompting strategies',
            'Temperature and sampling parameter tuning',
            'Prompt chaining and decomposition techniques'
        ]
    },
    training: {
        icon: 'fas fa-brain',
        color: '#00ced1',
        title: 'AI Training',
        description: 'Our AI training services help you create custom models fine-tuned for your specific domain and use cases. We handle the entire training pipeline from data collection and preparation through model evaluation and deployment. Whether you need improved performance on specialized tasks, custom behavior patterns, or domain-specific knowledge, we develop training strategies that deliver measurable improvements while maintaining safety and alignment. Our approach includes careful dataset curation, systematic evaluation, and iterative refinement.',
        benefits: [
            'Superior performance on domain-specific tasks',
            'Reduced inference costs through smaller models',
            'Custom behavior and output formatting',
            'Proprietary knowledge integration',
            'Better alignment with your use cases',
            'Competitive advantage through specialized models'
        ],
        useCases: [
            'Industry-specific language models',
            'Custom coding or technical assistants',
            'Brand voice and style adaptation',
            'Specialized classification tasks',
            'Domain knowledge integration'
        ],
        technical: [
            'Fine-tuning on custom datasets',
            'LoRA and parameter-efficient techniques',
            'Dataset preparation and curation',
            'Evaluation metrics and benchmarking',
            'Hyperparameter optimization',
            'Model compression and quantization',
            'Continuous learning and updates'
        ]
    }
};

// Open Modal
function openServiceModal(serviceKey) {
    var service = serviceData[serviceKey];
    var modal = document.getElementById('serviceModal');
    var modalIcon = document.getElementById('modalIcon');
    var modalTitle = document.getElementById('modalTitle');
    var modalBody = document.getElementById('modalBody');

    // Set icon
    modalIcon.className = 'service-modal-icon ' + service.icon;
    modalIcon.style.color = service.color;

    // Set title
    modalTitle.textContent = service.title;

    // Build body content
    var bodyHTML = '<div class="service-modal-description">' + service.description + '</div>' +
        '<div class="service-modal-section">' +
        '<h4><i class="fas fa-check-circle me-2"></i>Key Benefits</h4>' +
        '<ul>' + service.benefits.map(function(b) { return '<li>' + b + '</li>'; }).join('') + '</ul>' +
        '</div>' +
        '<div class="service-modal-section">' +
        '<h4><i class="fas fa-lightbulb me-2"></i>Use Cases</h4>' +
        '<ul>' + service.useCases.map(function(u) { return '<li>' + u + '</li>'; }).join('') + '</ul>' +
        '</div>' +
        '<div class="service-modal-section">' +
        '<h4><i class="fas fa-cogs me-2"></i>Technical Approach</h4>' +
        '<ul>' + service.technical.map(function(t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' +
        '</div>';

    modalBody.innerHTML = bodyHTML;

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close Modal
function closeServiceModal() {
    var modal = document.getElementById('serviceModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close modal on background click
document.getElementById('serviceModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeServiceModal();
    }
});

// Close modal on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeServiceModal();
    }
});

// Contact Form Handler
document.getElementById('serviceContactForm').addEventListener('submit', function(e) {
    e.preventDefault();

    var name = document.getElementById('contactName').value;
    var email = document.getElementById('contactEmail').value;
    var service = document.getElementById('serviceSelect').value;
    var subject = document.getElementById('contactSubject').value;
    var message = document.getElementById('contactMessage').value;

    // Build mailto URL
    var recipient = 'unityailabcontact@gmail.com';
    var mailtoSubject = '[' + service + '] ' + subject;
    var mailtoBody = 'Name: ' + name + '\nEmail: ' + email + '\nService: ' + service + '\n\nMessage:\n' + message;

    var mailtoURL = 'mailto:' + recipient + '?subject=' + encodeURIComponent(mailtoSubject) + '&body=' + encodeURIComponent(mailtoBody);

    // Open mailto link
    window.location.href = mailtoURL;
});
