# Install the required packages within R before performing the given analysis
# Required packages
library(sf)
library(dplyr)
library(cluster)
library(ggplot2)

# File paths
input_path <- "Your/input/files/path"
output_path <- "Your/output/files/path/output.shp"

# 1. Load the shapefile
shape <- st_read(input_path)

# 2. Select numeric columns for clustering
numeric_data <- shape %>% 
  st_drop_geometry() %>%
  select(where(is.numeric)) %>%
  na.omit()

# 3. Perform K-means clustering with k = 3
set.seed(123)  # for reproducibility
kmeans_result <- kmeans(numeric_data, centers = 3, nstart = 25)

# 4. Calculate mean and standard deviation for each cluster
numeric_data$cluster <- kmeans_result$cluster

stats <- numeric_data %>%
  group_by(cluster) %>%
  summarise(across(where(is.numeric), list(mean = mean, sd = sd), .names = "{.col}_{.fn}"))

print("📊 CLUSTER STATISTICS:")
print(stats)

# 5. Add cluster labels back to the original shapefile
shape$cluster <- as.factor(kmeans_result$cluster)

# 6. Export the shapefile with cluster information
st_write(shape, output_path, delete_layer = TRUE)

# 7. (Optional) Visualize clusters
ggplot(shape) +
  geom_sf(aes(fill = cluster)) +
  scale_fill_brewer(palette = "Set1") +
  theme_minimal() +
  ggtitle("K-means clustering (k=3)")

# 8. Short explanation
cat("\n🧠 Explanation:\n")
cat("A K-means clustering with k=3 was performed on the numeric attributes of the shapefile.\n")
cat("Each feature was assigned to one of the three clusters.\n")
cat("Mean and standard deviation were computed for each cluster and variable.\n")
cat("The resulting shapefile, with a new 'cluster' column, was saved to:\n")
cat(output_path, "\n")
