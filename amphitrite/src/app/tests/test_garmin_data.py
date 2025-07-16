import csv


def test_parse_file():
    with open('/Users/annes/garmin_data/fdr_20190407_000000.csv', mode='r', encoding='utf-8-sig') as all_data:
        with open('/Users/annes/garmin_data/fdr_20250506_20250507_col0_45_withheader.csv', mode='w', encoding='utf-8-sig') as test_flights:
            try:
                csv_lines = csv.reader(all_data)
                cols = []
                for idx, csv_line in enumerate(csv_lines):
                    if idx == 0:
                        test_flights.write(",".join(csv_line) + "\n")
                        continue
                    csv_line_short = csv_line[0:46]
                    if idx == 1:
                        for col_idx, col in enumerate(csv_line):
                            print(f"{col_idx}, {col}")
                            cols.append(col)
                        #    if col.startswith("Wind"):
                        #        print(f"Wind column: {col_idx}")
                        test_flights.write(",".join(csv_line_short) + "\n")
                    if csv_line[0] == '2025-05-07' or csv_line[0] == '2025-05-06':
                        for col_idx, col in enumerate(csv_line_short):
                            test_flights.write(f"{cols[col_idx]}: {col},")
                        test_flights.write("\n")
            except Exception as e:
                print("error parsing: " + e)
