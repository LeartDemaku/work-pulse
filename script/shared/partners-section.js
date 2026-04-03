document.addEventListener('DOMContentLoaded', () => {
    const partnersContainer = document.getElementById('partners-track');
    if (!partnersContainer) return;

    // Partner Data
    const partners = [
        { name: "PBCA", initials: "PA", color: "#3B82F6" },
        { name: "Klan Kosova", initials: "KK", color: "#EF4444" },
        { name: "StarLabs", initials: "SL", color: "#8B5CF6" },
        { name: "Europrinty", initials: "EP", color: "#10B981" },
        { name: "American Hospital", initials: "AH", color: "#F59E0B" },
        { name: "British College of Sciences", initials: "BCS", color: "#6366F1" },
        { name: "Ximi Vogue", initials: "XV", color: "#EC4899" },
        { name: "Elkos Group", initials: "EG", color: "#14B8A6" },
        { name: "SPAR", initials: "SP", color: "#EF4444" },
        { name: "Artmotion", initials: "A", color: "#8B5CF6" },
        { name: "IPKO", initials: "IP", color: "#3B82F6" },
        { name: "Devolli Corporation", initials: "DC", color: "#F59E0B" },
        { name: "Besa Security", initials: "BS", color: "#EF4444" },
        { name: "NLB Banka", initials: "NB", color: "#3B82F6" },
        { name: "Petrol Company", initials: "PC", color: "#10B981" },
        { name: "Auto Sherreti", initials: "ASh", color: "#6366F1" },
        { name: "IBAS", initials: "I", color: "#F59E0B" },
        { name: "INTEREX", initials: "I", color: "#EF4444" },
        { name: "Reload Arms", initials: "RA", color: "#14B8A6" },
        { name: "A2 CNN", initials: "AC", color: "#EC4899" }
    ];

    // Create the markup
    const createPartnerCard = (partner) => {
        return `
            <div class="partner-card" role="article" aria-label="${partner.name}">
                <div class="partner-icon" style="background-color: ${partner.color}15; color: ${partner.color};">
                    ${partner.initials}
                </div>
                <span class="partner-name">${partner.name}</span>
            </div>
        `;
    };

    // Render functionality
    const renderPartners = () => {
        // We need 2 sets of partners for the infinite loop effect
        const doubledPartners = [...partners, ...partners];

        const cardsHTML = doubledPartners.map(createPartnerCard).join('');
        partnersContainer.innerHTML = cardsHTML;

        // Add Intersection Observer for entrance animation
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });

        const section = document.querySelector('.partners-section');
        if (section) observer.observe(section);
    };

    renderPartners();
});
