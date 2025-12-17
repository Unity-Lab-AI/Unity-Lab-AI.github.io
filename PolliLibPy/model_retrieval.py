"""
Model Retrieval - List available text and image models
Implements the Model Retrieval section from the TODO list
"""

from .pollylib import PollinationsAPI
import json
from typing import List, Dict, Any


class ModelRetrieval(PollinationsAPI):
    """Class for retrieving available models from Pollinations.AI"""

    def list_text_models(self, normalized: bool = True) -> List[Dict[str, Any]]:
        """
        List all available text generation models.

        Args:
            normalized: Return normalized model schema with full details

        Returns:
            List of model information dictionaries
        """
        try:
            response = self.retry_request(
                "GET",
                self._get_url_with_key(self.TEXT_MODELS_API)
            )

            models = response.json()

            if normalized:
                # Return normalized schema as per TODO requirements
                return self._normalize_text_models(models)

            return models

        except Exception as e:
            print(f"Error retrieving text models: {e}")
            return []

    def _normalize_text_models(self, models: Any) -> List[Dict[str, Any]]:
        """
        Normalize text model data into standard schema.

        Returns schema with:
        - name and description
        - max input tokens
        - reasoning capability flag
        - tier
        - community supported flag
        - input types array
        - output types array
        - tool use / function calling flag
        - aliases array
        - vision flag
        - audio flag
        - voices array
        - system messages supported flag
        - uncensored flag
        """
        normalized = []

        # Handle different response formats
        if isinstance(models, list):
            model_list = models
        elif isinstance(models, dict):
            model_list = models.get('models', [])
        else:
            return []

        for model in model_list:
            if isinstance(model, str):
                # Basic model name only
                normalized_model = {
                    "name": model,
                    "description": f"{model} text generation model",
                    "max_input_tokens": 128000,  # Default estimate
                    "reasoning_capable": "reasoning" in model.lower(),
                    "tier": "standard",
                    "community_supported": False,
                    "input_types": ["text"],
                    "output_types": ["text"],
                    "tool_use": "openai" in model.lower(),
                    "aliases": [],
                    "vision": "vision" in model.lower() or model in ["openai", "openai-large", "claude-hybridspace"],
                    "audio": "audio" in model.lower(),
                    "voices": ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] if "audio" in model.lower() else [],
                    "system_messages_supported": True,
                    "uncensored": False
                }
            else:
                # Structured model data
                normalized_model = {
                    "name": model.get("name", "unknown"),
                    "description": model.get("description", ""),
                    "max_input_tokens": model.get("max_input_tokens", 128000),
                    "reasoning_capable": model.get("reasoning_capable", False),
                    "tier": model.get("tier", "standard"),
                    "community_supported": model.get("community_supported", False),
                    "input_types": model.get("input_types", ["text"]),
                    "output_types": model.get("output_types", ["text"]),
                    "tool_use": model.get("tool_use", False),
                    "aliases": model.get("aliases", []),
                    "vision": model.get("vision", False),
                    "audio": model.get("audio", False),
                    "voices": model.get("voices", []),
                    "system_messages_supported": model.get("system_messages_supported", True),
                    "uncensored": model.get("uncensored", False)
                }

            normalized.append(normalized_model)

        return normalized

    def list_image_models(self, normalized: bool = True) -> List[Dict[str, Any]]:
        """
        List all available image generation models.

        Args:
            normalized: Return normalized model schema with full details

        Returns:
            List of model information dictionaries including:
            - style tags
            - input/output limits
            - supported formats
        """
        try:
            response = self.retry_request(
                "GET",
                self._get_url_with_key(self.IMAGE_MODELS_API)
            )

            models = response.json()

            if normalized:
                return self._normalize_image_models(models)

            return models

        except Exception as e:
            print(f"Error retrieving image models: {e}")
            return []

    def _normalize_image_models(self, models: Any) -> List[Dict[str, Any]]:
        """
        Normalize image model data into standard schema.

        Returns schema with:
        - name and description
        - style tags
        - input/output limits
        - supported formats
        """
        normalized = []

        # Handle different response formats
        if isinstance(models, list):
            model_list = models
        elif isinstance(models, dict):
            model_list = models.get('models', [])
        else:
            return []

        # Known model characteristics
        model_info = {
            "flux": {
                "description": "High-quality image generation model",
                "style_tags": ["photorealistic", "artistic", "detailed"],
                "max_width": 2048,
                "max_height": 2048,
                "supports_img2img": False
            },
            "turbo": {
                "description": "Fast image generation model",
                "style_tags": ["quick", "artistic"],
                "max_width": 1024,
                "max_height": 1024,
                "supports_img2img": False
            },
            "kontext": {
                "description": "Image-to-image transformation model",
                "style_tags": ["transformation", "editing"],
                "max_width": 2048,
                "max_height": 2048,
                "supports_img2img": True
            }
        }

        for model in model_list:
            if isinstance(model, str):
                model_name = model
                info = model_info.get(model_name, {})

                normalized_model = {
                    "name": model_name,
                    "description": info.get("description", f"{model_name} image model"),
                    "style_tags": info.get("style_tags", ["general"]),
                    "max_width": info.get("max_width", 2048),
                    "max_height": info.get("max_height", 2048),
                    "min_width": 256,
                    "min_height": 256,
                    "supported_formats": ["jpg", "jpeg", "png"],
                    "supports_img2img": info.get("supports_img2img", False),
                    "supports_seed": True,
                    "supports_enhancement": True
                }
            else:
                # Structured model data
                normalized_model = {
                    "name": model.get("name", "unknown"),
                    "description": model.get("description", ""),
                    "style_tags": model.get("style_tags", []),
                    "max_width": model.get("max_width", 2048),
                    "max_height": model.get("max_height", 2048),
                    "min_width": model.get("min_width", 256),
                    "min_height": model.get("min_height", 256),
                    "supported_formats": model.get("supported_formats", ["jpg", "png"]),
                    "supports_img2img": model.get("supports_img2img", False),
                    "supports_seed": model.get("supports_seed", True),
                    "supports_enhancement": model.get("supports_enhancement", True)
                }

            normalized.append(normalized_model)

        return normalized


def main():
    """Example usage of model retrieval"""
    print("=" * 60)
    print("Model Retrieval Examples")
    print("=" * 60)

    retriever = ModelRetrieval()

    # List text models
    print("\n1. Listing Text Models:")
    print("-" * 60)
    text_models = retriever.list_text_models()
    for model in text_models:
        print(f"\nModel: {model['name']}")
        print(f"  Description: {model['description']}")
        print(f"  Max Tokens: {model['max_input_tokens']}")
        print(f"  Reasoning: {model['reasoning_capable']}")
        print(f"  Vision: {model['vision']}")
        print(f"  Audio: {model['audio']}")
        print(f"  Tool Use: {model['tool_use']}")
        if model['voices']:
            print(f"  Voices: {', '.join(model['voices'])}")

    # List image models
    print("\n\n2. Listing Image Models:")
    print("-" * 60)
    image_models = retriever.list_image_models()
    for model in image_models:
        print(f"\nModel: {model['name']}")
        print(f"  Description: {model['description']}")
        print(f"  Style Tags: {', '.join(model['style_tags'])}")
        print(f"  Max Size: {model['max_width']}x{model['max_height']}")
        print(f"  Formats: {', '.join(model['supported_formats'])}")
        print(f"  Image-to-Image: {model['supports_img2img']}")

    # Export to JSON
    print("\n\n3. Exporting model data to JSON:")
    print("-" * 60)
    with open("text_models.json", "w") as f:
        json.dump(text_models, f, indent=2)
    print("Text models saved to text_models.json")

    with open("image_models.json", "w") as f:
        json.dump(image_models, f, indent=2)
    print("Image models saved to image_models.json")


if __name__ == "__main__":
    main()
