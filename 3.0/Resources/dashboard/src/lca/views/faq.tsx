import React from 'react';
import './faq.scss';
import Logo from '../../images/ESG_now_logo.png';
import Ecoinventlogo from '../../images/ecoinvent_logo.png';
import Chartimage from '../../images/chartimage.png';
import EmissionFactorImage from '../../images/emission_factor_image.png';
import Ivivalogo from '../../images/iviva_logo.png';

const ESGNowFAQ: React.FC = () => {
    return (
        <div className="esgnow-container">
            <div className="esgnow-header-image">
                <img src={Logo} 
                alt="FAQ Banner" />
            </div>

            <h1 className="esgnow-h1">Frequently Asked Questions</h1>

            <div className="esgnow-question">1. What is ESG Now?</div>
            <div className="esgnow-answer">
                <p>ESG Now is a software solution built on iviva, a Composable Integration Platform that enables the rapid development of modular, scalable applications. ESG Now leverages this capability to deliver dedicated tools for environmental reporting and product carbon footprint analysis. </p>
                <p>It offers two key modules:</p>
                <ul>
                    <li><strong>Carbon Accounting:</strong> For tracking and reporting organisational carbon emissions.</li>
                    <li><strong>Procurement:</strong> For calculating the product carbon footprint using Life Cycle Assessment.</li>
                </ul>
                <p>The Procurement module assists businesses in assessing product carbon footprints by leveraging AI to generate the Bill of Materials (BoM), identify manufacturing processes, and calculate emissions using emission factors from trusted sources like Ecoinvent. This enables businesses to compare products, make sustainable purchasing decisions, and meet Scope 3 reporting requirements. </p>
            </div>

            <div className="esgnow-question">2. What is the scope of the Life Cycle Assessment we are conducting?</div>
            <div className="esgnow-answer">
                <p>A Life Cycle Assessment (LCA) evaluates the environmental impacts associated with all stages of a product's life. For ESG Now, the assessment encompasses: </p>
                <img
                    src={Chartimage}
                    alt="Life Cycle Assessment scope diagram"
                    className="esgnow-image"
                />
                <ul>
                    <li><strong>Cradle to Gate:</strong> This phase includes the environmental impacts from the extraction and transportation of raw materials, through material processing and manufacturing, up to the point where the finished product leaves the factory.</li>
                    <li><strong>Transportation (Port to Port):</strong> We also account for the environmental impacts from shipping the finished product from the origin port (e.g., Port of Shanghai) to the destination port (e.g., Port of Le Havre).</li>
                </ul>
            </div>

            <div className="esgnow-question">3. Which environmental impact categories are assessed?</div>
            <div className="esgnow-answer">
                <p>The primary environmental impact category currently assessed in ESG Now is climate change, specifically Global Warming Potential over 100 years (GWP 100), which measures greenhouse gas emissions (such as carbon dioxide, methane, and nitrous oxide) over a 100-year period.
                    The GWP 100 values are sourced from the Ecoinvent database, which applies the Global Warming Potentials defined in the Intergovernmental Panel on Climate Change (IPCC) Fifth Assessment Report (AR5), as required by the European Product Environmental Footprint (PEF) methodology.</p>
            </div>

            <div className="esgnow-question">4. What is the functional unit used in the life cycle assessment?</div>
            <div className="esgnow-answer">
                <p>A functional unit defines the reference to which environmental impacts are related, ensuring
                    that results can be consistently compared across different products and assessments.
                    For ESG Now, the functional unit is one unit of product. The assessed climate change impact is
                    reported as the total kilograms of carbon dioxide equivalent (kg CO2e) emitted per product
                    unit.
                    This approach aligns with the European PEF methodology, which requires the functional unit to
                    be clearly defined in terms of the product's function, performance, and duration. By specifying
                    the functional unit as one product unit, ESG Now ensures that the environmental impact
                    assessments are consistent, reproducible, and comparable across different products and
                    sectors.
                </p>
            </div>

            <div className="esgnow-question">5. What material categories are included?</div>
            <div className="esgnow-answer">
                <p>The platform covers 11 main material groups, with over 150 sub-materials:</p>
                <div className="esgnow-material-list">
                    <ul>
                        <li>Wood</li>
                        <li>Metal</li>
                        <li>Plastic</li>
                        <li>Glass</li>
                        <li>Fabric</li>
                        <li>Leather</li>
                        <li>Laminate</li>
                        <li>Mesh</li>
                        <li>Foam</li>
                        <li>Stone</li>
                    </ul>

                </div>
            </div>
            <p>These categories reflect the materials commonly used in furniture, interior fit-outs, and hospitality
                industry products.
            </p>

            <div className="esgnow-question">6. Which emission factors are used in our life cycle assessments?</div>
            <div className="esgnow-answer">
                <p>We use emission factors from reliable and widely accepted sources that provide detailed data
                    on emissions related to raw materials, manufacturing processes, and transportation.
                    Our approach follows a two-step hierarchy:
                </p>
                <ul>
                    <li><strong>Primary source: </strong>We subscribe to Ecoinvent, which is one of the world’s most trusted life
                        cycle inventory databases, offering comprehensive and peer-reviewed emission factors</li>
                    <li><strong>Secondary sources:</strong> If Ecoinvent does not contain data for a particular material or
                        process, we use AI to help identify alternate sources such as EPDs, peer-reviewed
                        scientific literature, or verified manufacturing reports to ensure the calculation can be
                        completed.
                    </li>
                </ul>
            </div>

            <div className="esgnow-question">7. How does the platform select emission factors for materials?</div>
            <div className="esgnow-answer">
                <p>Emission factors for materials are selected using a clear hierarchy and fallback logic to ensure consistency, transparency, and completeness. The AI reviews the materials database and, when an exact match is not available, recommends either:</p>
                <ul>
                    <li>A proxy emission factor based on a material with similar properties, or</li>
                    <li>A category average factor where no close proxy exists.</li>
                </ul>
                <p>The AI analyses the material composition and associated attributes to select the most appropriate emission factor from the available data.</p>
                <img
                    src={EmissionFactorImage}
                    alt="Life Cycle Assessment scope diagram"
                    className="esgnow-image"
                />
            </div>

            <div className="esgnow-question">8. How is artificial intelligence (AI) used in the platform?</div>
            <div className="esgnow-answer">
                <p>The platform uses advanced foundational models - large language models trained on diverse datasets - to assist with key data selection and generation tasks. This approach allows the platform to process complex product information and suggest relevant categories, materials, and processes with speed and scalability.

                    Using the product information provided, the AI supports users in three main ways:</p>
                <ul>
                    <li><strong>Product categorisation: </strong>The AI suggests the most appropriate category from the platform's predefined category structure.</li>
                    <li><strong>BoM generation:</strong>The AI generates a list of likely materials, from the platform's material databases, and assigns approximate weights, following industry norms.</li>
                    <li><strong>Manufacturing process selection:</strong>The AI recommends manufacturing processes that align with the selected materials and product type, using logic informed by industrial practices.</li>
                </ul>
                <p>While AI assists in streamlining these steps, reducing the time and effort required for life cycle assessment setup, users retain full control and can review and adjust any AI-generated outputs.</p>
            </div>

            <div className="esgnow-question">9. How accurate are the emission results provided by the platform?</div>
            <div className="esgnow-answer">
                <p>Based on initial testing, the platform's emission results have achieved approximately <strong>70% alignment</strong> with results typically obtained through conventional LCAs. However, the level of accuracy can vary depending on several factors:</p>
                <ul>
                    <li>Whether the assessment relies on specific primary data provided by the user or relies on AI when primary data is unavailable.</li>
                    <li>The quality and completeness of information provided by the user when using AI assistance (for example, product descriptions and images).</li>
                    <li>The platform uses proxy energy data based on the material or similar products, which may differ from the primary energy data used in conventional LCAs.</li>
                </ul>
                <div className="esgnow-note"><strong>Note:</strong> The platform is designed to provide reliable estimates suitable for supporting procurement decisions and reporting. However, if results are to be submitted for ecolabelling, certification, or regulatory disclosure, third-party verified assessments may be required to meet formal compliance standards.</div>
            </div>

            <div className="esgnow-footer">
                <div className="esgnow-footer-title"><img
                    src={Ivivalogo}
                    alt="iviva logo"
                    className="esgnow-footer-iviva-image"
                /></div>

                <p><strong>iviva</strong> is a global software company offering a Composable Integration Platform
                    designed to rapidly develop modular, scalable applications for smart workplaces,
                    facilities management, and sustainability initiatives. By leveraging pre-built
                    connectors and a low-code environment, iviva enables seamless integration of
                    building operations, asset management, ESG reporting, and carbon footprint
                    tracking. This approach empowers organisations to enhance efficiency, achieve
                    sustainability goals, and drive digital transformation.</p>

                <div className="esgnow-footer-title">
                    <div className="esgnow-footer-title"><img
                        src={Ecoinventlogo}
                        alt="ecoinvent logo"
                        className="esgnow-footer-ecoinvent-image"
                    /></div>

                </div>
                <p><strong>Ecoinvent</strong> is a Switzerland-based non-profit organisation that provides one of the
                    world’s most comprehensive and trusted life cycle inventory (LCI) databases. It
                    offers peer-reviewed data covering raw materials, manufacturing processes,
                    transportation, and waste management, supporting robust life cycle assessments
                    (LCA), carbon footprint calculations, and sustainability reporting. Ecoinvent’s data is
                    widely recognised for its transparency, scientific rigour, and alignment with
                    international standards such as ISO 14040, ISO 14044, the GHG Protocol, and the
                    European Product Environmental Footprint (PEF) methodology.</p>
            </div>
        </div>
    );
};

export default ESGNowFAQ;
